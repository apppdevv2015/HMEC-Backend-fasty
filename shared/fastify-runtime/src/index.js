const http = require('http');
const https = require('https');
const querystring = require('querystring');
const fastify = require('fastify');
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const compress = require('@fastify/compress');
const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');

const {
  requestContextMiddleware,
} = require('../../logger/requestContext.middleware');

const logger = require('../../logger/logger');

const requestIdPlugin = require('./plugins/request-id.plugin');
const responsePlugin = require('./plugins/response.plugin');
const errorHandlerPlugin = require('./plugins/error-handler.plugin');
const authPlugin = require('./plugins/auth.plugin');
const { AppError, codeFromStatus, messageFromStatus, normalizeDetails } = require('./errors/AppError');
const { ERROR_CODES } = require('./errors/errorCodes');
const { HTTP_STATUS } = require('./errors/statusCodes');
const { normalizeError, normalizeZodErrors } = require('./utils/error-normalizer');

const {
  buildCursorPagination,
  buildPagePagination,
  normalizePagination,
} = require('./utils/pagination-builder');

const {
  buildErrorResponse,
  buildResponseMeta,
  buildSuccessResponse,
  sanitizeJson,
} = require('./utils/response-builder');

const {
  applyStandardOpenApiResponses,
  commonResponses,
  commonSchemas,
  getCommonOpenApiComponents,
  mergeCommonOpenApiComponents,
} = require('./schemas/response.schema');

const {
  authenticateJwt: createJwtAuthHook,
  authorize: createAuthorizationHook,
  authorizeRoles: createRoleAuthorizationHook,
  buildAccessTokenPayload,
  buildTrustedUserHeaders,
  buildUserContext,
  createRefreshToken,
  getInternalRequestContext,
  hashRefreshToken,
  INTERNAL_CONTEXT_HEADERS,
  resolveJwtConfig,
  signAccessToken,
  stripInternalAuthHeaders,
  verifyInternalRequest: createInternalAuthHook,
  verifyJwtToken,
} = authPlugin;

const memoryRateLimitStore = new Map();
const memoryCacheStore = new Map();
const memoryIdempotencyStore = new Map();
const circuitRegistry = new Map();

const ROUTE_MANIFEST_PATH = '/.well-known/ira-routes';

function parseBytes(value, fallback = 1024 * 1024) {
  if (typeof value === 'number') {
    return value;
  }

  const match = String(value || '').trim().toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)?$/);

  if (!match) {
    return fallback;
  }

  const amount = Number(match[1]);
  const unit = match[2] || 'b';

  const factors = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  return Math.floor(amount * factors[unit]);
}

function isInfrastructureRoute(request) {
  const url = String(request.originalUrl || request.url || '').toLowerCase();

  return (
    url.includes('/health') ||
    url.includes('/docs') ||
    url.includes('/api-docs') ||
    url.includes('/openapi.json')
  );
}

function createFastifyApp(options = {}) {
  const security = options.security || {};
  const bodyLimit = parseBytes(security.requestBodyLimit || process.env.REQUEST_BODY_LIMIT || '1mb');

  const app = fastify({
    bodyLimit,
    disableRequestLogging: true,
    logger: options.logger ?? {
      level: process.env.LOG_LEVEL || 'info',
      redact: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers.x-internal-token',
        'req.headers.x-internal-service-token',
        'req.headers.x-auth-user-id',
        'req.headers.x-auth-user-role',
        'req.headers.x-auth-user-permissions',
        'req.headers.x-auth-user-name',
        'req.headers.x-auth-user-email',
        'req.headers.x-auth-school-name',
        'req.headers.x-auth-school-region',
        'req.headers.x-auth-school-country-id',
        'req.headers.x-auth-learner-id',
        'req.headers.x-auth-student-id',
        'req.headers.x-auth-class-id',
        'req.headers.x-auth-grade-id',
        'req.headers.x-auth-life-id',
        'req.headers.x-auth-public-life-id',
        'req.headers.x-auth-life-code',
        'req.headers.x-auth-life-id-record-id',
        'req.headers.x-auth-token-jti',
        'req.headers.x-auth-token-exp',
        'req.body.password',
        'req.body.oldPassword',
        'req.body.newPassword',
        'req.body.confirmPassword',
        'req.body.refreshToken',
        'req.body.accessToken',
        'req.body.token',
        'req.body.resetToken',
        'req.body.resetSessionId',
        'req.body.otp',
        'req.body.pin',
        'req.body.mpin',
        'req.body.mPin',
        'req.body.mPIN',
        'req.body.newPin',
        'req.body.confirmPin',
        'password',
        'oldPassword',
        'newPassword',
        'confirmPassword',
        'token',
        'refreshToken',
        'accessToken',
        'resetToken',
        'resetSessionId',
        'otp',
        'pin',
        'mpin',
        'mPin',
        'mPIN',
        'newPin',
        'confirmPin',
        'secret',
      ],
    },
    trustProxy: options.trustProxy ?? true,
  });

  app.addContentTypeParser(
    'application/x-www-form-urlencoded',
    { parseAs: 'string', bodyLimit },
    (_request, body, done) => {
      done(null, querystring.parse(body));
    }
  );

  const routeManifest = new Map();

  app.decorate('routeManifest', routeManifest);

  app.addHook('onRoute', createRouteManifestHook(routeManifest));

  app.get(ROUTE_MANIFEST_PATH, createRouteManifestHandler(routeManifest, {
    serviceName: options.serviceName,
    apiVersion: options.apiVersion || 'v1',
  }));

  app.register(requestIdPlugin, {
    serviceName: options.serviceName,
    headerName: options.requestIdHeaderName,
  });

  app.register(responsePlugin, {
    serviceName: options.serviceName,
    apiVersion: options.apiVersion || 'v1',
  });

  app.register(errorHandlerPlugin, {
    serviceName: options.serviceName,
  });

  app.register(authPlugin, options.authOptions || {});
  app.register(helmet, options.helmetOptions || { contentSecurityPolicy: false });
  app.register(cors, security.corsOptions || options.corsOptions || {});
  app.register(compress, options.compressOptions || {});

  /**
   * Hook order matters:
   * 1. requestContextMiddleware creates requestId/correlationId.
   * 2. backpressure can reject overloaded requests.
   * 3. request logger writes started logs.
   * 4. response logger writes finished logs.
   * 5. error logger writes thrown errors.
   */
  app.addHook('onRequest', requestContextMiddleware);

  app.addHook('onRequest', createBackpressureHook({
    maxInflight: options.maxInflight,
    skip: options.skipBackpressure || isInfrastructureRoute,
  }));

  app.addHook('onRequest', createRequestLoggerHook({
    serviceName: options.serviceName,
    skip: options.skipRequestLog || isInfrastructureRoute,
  }));

  app.addHook('onSend', createRequestFinishedLoggerHook({
    serviceName: options.serviceName,
    skip: options.skipRequestLog || isInfrastructureRoute,
  }));

  app.addHook('onError', createDbErrorLoggerHook({
    serviceName: options.serviceName,
    skip: options.skipErrorLog || isInfrastructureRoute,
  }));

  if (options.swaggerSpec) {
    registerSwagger(app, {
      spec: options.swaggerSpec,
      docsRoutePrefix: options.docsRoutePrefix,
      openApiJsonPath: options.openApiJsonPath,
    });
  }

  return app;
}

function normalizeRouteMethods(method) {
  return (Array.isArray(method) ? method : [method])
    .map((item) => String(item || '').toUpperCase())
    .filter((item) => item !== 'HEAD')
    .filter(Boolean);
}

function isHiddenManifestRoute(url) {
  const routeUrl = String(url || '');

  return (
    routeUrl === ROUTE_MANIFEST_PATH ||
    routeUrl.includes('/docs') ||
    routeUrl.includes('/api-docs') ||
    routeUrl.includes('/openapi.json')
  );
}

function createRouteManifestHook(routeManifest) {
  return function onRoute(routeOptions) {
    const url = routeOptions.url || routeOptions.path;

    if (!url || isHiddenManifestRoute(url)) {
      return;
    }

    for (const method of normalizeRouteMethods(routeOptions.method)) {
      routeManifest.set(`${method} ${url}`, {
        method,
        path: url,
      });
    }
  };
}

function createRouteManifestHandler(routeManifest, options = {}) {
  return function routeManifestHandler(request, reply) {
    const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

    if (internalToken) {
      getInternalRequestContext(request, {
        trustedServices: options.trustedServices,
      });
    }

    return reply.send({
      service: options.serviceName || 'service',
      version: options.apiVersion || 'v1',
      routes: Array.from(routeManifest.values())
        .sort((left, right) => `${left.path}:${left.method}`.localeCompare(`${right.path}:${right.method}`)),
    });
  };
}

function registerSwagger(app, options = {}) {
  const spec = applyStandardOpenApiResponses(options.spec || {});

  app.register(swagger, {
    mode: 'static',
    specification: {
      document: spec,
    },
  });

  app.register(swaggerUi, {
    routePrefix: options.docsRoutePrefix || '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      persistAuthorization: true,
    },
  });

  app.get(options.openApiJsonPath || '/openapi.json', async () => spec);
}

function createRequestLoggerHook(options = {}) {
  const serviceName = options.serviceName || 'service';
  const skip = options.skip || (() => false);

  return function requestLogger(request, _reply, done) {
    request.startTime = Date.now();

    if (!skip(request)) {
      logger.info('Request started', {
        service: serviceName,
        requestId: request.requestId || null,
        correlationId: request.correlationId || null,
        method: request.method,
        url: request.originalUrl || request.url,
        ipAddress: request.ip,
        userAgent: request.headers?.['user-agent'] || null,
      });
    }

    done();
  };
}

function createRequestFinishedLoggerHook(options = {}) {
  const serviceName = options.serviceName || 'service';
  const skip = options.skip || (() => false);

  return function requestFinishedLogger(request, reply, payload, done) {
    if (skip(request)) {
      done(null, payload);
      return;
    }

    const duration = Date.now() - (request.startTime || Date.now());
    const statusCode = reply.statusCode;
    const isErrorStatus = statusCode >= 400;

    let responseMessage = null;

    try {
      const body = Buffer.isBuffer(payload)
        ? JSON.parse(payload.toString('utf8'))
        : typeof payload === 'string'
          ? JSON.parse(payload)
          : null;

      responseMessage =
        body?.message ||
        body?.error?.message ||
        body?.error ||
        null;
    } catch (_error) {
      responseMessage = null;
    }

    logger[isErrorStatus ? 'error' : 'info'](
      isErrorStatus
        ? responseMessage || `HTTP ${statusCode}`
        : 'Request finished',
      {
        service: serviceName,
        requestId: request.requestId || null,
        correlationId: request.correlationId || null,

        userId: request.user?.id || request.user?.userId || null,
        userRole: request.user?.role || request.user?.roleName || null,
        companyId: request.user?.companyId || request.user?.schoolId || null,

        method: request.method,
        url: request.originalUrl || request.url,
        status: statusCode,
        duration,

        error: isErrorStatus
          ? responseMessage || `HTTP ${statusCode}`
          : null,
        errorCode: isErrorStatus ? `HTTP_${statusCode}` : null,

        ipAddress: request.ip,
        userAgent: request.headers?.['user-agent'] || null,
      }
    );

    done(null, payload);
  };
}

function createDbErrorLoggerHook(options = {}) {
  const serviceName = options.serviceName || 'service';
  const skip = options.skip || (() => false);

  return function dbErrorLoggerHook(request, reply, error, done) {
    if (!skip(request)) {
      const duration = Date.now() - (request.startTime || Date.now());

      logger.error(error.message || 'Request failed', {
        service: serviceName,
        requestId: request.requestId || null,
        correlationId: request.correlationId || null,

        userId: request.user?.id || request.user?.userId || null,
        userRole: request.user?.role || request.user?.roleName || null,
        companyId: request.user?.companyId || request.user?.schoolId || null,

        method: request.method || null,
        url: request.originalUrl || request.url || null,
        status: error.statusCode || reply.statusCode || 500,
        duration,

        module: error.module || null,
        action: error.action || null,

        error: error.name || error.code || 'Error',
        prismaCode: error.code || null,
        clientVersion: error.clientVersion || null,
        stack: error.stack || null,

        ipAddress: request.ip || null,
        userAgent: request.headers?.['user-agent'] || null,

        metadata: {
          params: request.params || {},
          query: request.query || {},
        },
      });
    }

    done();
  };
}

function createBackpressureHook(options = {}) {
  const maxInflight = Number(options.maxInflight || process.env.MAX_INFLIGHT_REQUESTS || 1000);
  const skip = options.skip || (() => false);
  let inflight = 0;

  return function backpressure(request, reply, done) {
    if (skip(request)) {
      done();
      return;
    }

    if (inflight >= maxInflight) {
      done(AppError.serviceUnavailable('Server is busy. Please retry shortly.'));
      return;
    }

    inflight += 1;

    let released = false;

    const release = () => {
      if (released) {
        return;
      }

      released = true;
      inflight = Math.max(0, inflight - 1);
    };

    reply.raw.once('finish', release);
    reply.raw.once('close', release);

    done();
  };
}

function createRateLimitHook(options = {}) {
  const windowMs = Number(options.windowMs || process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
  const max = Number(options.max || process.env.RATE_LIMIT_MAX || 300);
  const keyPrefix = options.keyPrefix || 'rate-limit';
  const skip = options.skip || (() => false);
  const redisClientProvider = options.redisClientProvider;

  return async function rateLimiter(request, reply) {
    if (skip(request)) {
      return;
    }

    const key = `${keyPrefix}:${hashValue(`${request.ip}:${request.headers.authorization || ''}`)}`;
    const count = await incrementCounter(key, windowMs, redisClientProvider);
    const remaining = Math.max(0, max - count);

    reply.header('RateLimit-Limit', String(max));
    reply.header('RateLimit-Remaining', String(remaining));
    reply.header('RateLimit-Reset', String(Math.ceil(windowMs / 1000)));

    if (count > max) {
      throw AppError.rateLimited(options.message || 'Too many requests. Please try again later.');
    }
  };
}

function createCacheHooks(options = {}) {
  const ttlSeconds = Number(options.ttlSeconds || process.env.GET_CACHE_TTL_SECONDS || 0);
  const enabled = options.enabled ?? String(process.env.ENABLE_HTTP_CACHE || 'false').toLowerCase() === 'true';
  const redisClientProvider = options.redisClientProvider;
  const keyPrefix = options.keyPrefix || 'http-cache';
  const skip = options.skip || (() => false);

  return {
    async preHandler(request, reply) {
      if (!enabled || ttlSeconds <= 0 || !['GET', 'HEAD'].includes(request.method) || skip(request)) {
        return;
      }

      const cacheKey = `${keyPrefix}:${hashValue(JSON.stringify({
        method: request.method,
        url: request.originalUrl || request.url,
        authorization: request.headers.authorization || '',
        accept: request.headers.accept || '',
      }))}`;

      const cached = await readStoredJson(cacheKey, redisClientProvider);

      if (cached) {
        reply.header('X-Cache', 'HIT').code(cached.statusCode).send(cached.body);
        return;
      }

      request.cacheKey = cacheKey;
      reply.header('X-Cache', 'MISS');
    },

    async onSend(request, reply, payload) {
      if (!request.cacheKey || reply.statusCode !== HTTP_STATUS.OK || payload === undefined) {
        return payload;
      }

      const body = parsePayload(payload);

      if (body !== undefined) {
        await writeStoredJson(request.cacheKey, { statusCode: reply.statusCode, body }, ttlSeconds, redisClientProvider);
      }

      return payload;
    },
  };
}

function createIdempotencyHooks(options = {}) {
  const ttlSeconds = Number(options.ttlSeconds || process.env.IDEMPOTENCY_TTL_SECONDS || 24 * 60 * 60);
  const redisClientProvider = options.redisClientProvider;
  const keyPrefix = options.keyPrefix || 'idempotency';
  const methods = new Set(options.methods || ['POST', 'PUT', 'PATCH', 'DELETE']);

  return {
    async preHandler(request, reply) {
      if (!methods.has(request.method)) {
        return;
      }

      const idempotencyKey = sanitizeHeaderValue(
        request.headers['idempotency-key'] || request.headers['x-idempotency-key']
      );

      if (!idempotencyKey) {
        return;
      }

      const fingerprint = hashValue(JSON.stringify({
        method: request.method,
        url: request.originalUrl || request.url,
        auth: request.headers.authorization || '',
        body: request.body || {},
      }));

      const baseKey = `${keyPrefix}:${idempotencyKey}:${fingerprint}`;
      const responseKey = `${baseKey}:response`;
      const lockKey = `${baseKey}:lock`;
      const cached = await readStoredJson(responseKey, redisClientProvider);

      if (cached) {
        reply.header('Idempotency-Status', 'cached').code(cached.statusCode).send(cached.body);
        return;
      }

      const locked = await acquireLock(lockKey, request.requestId, ttlSeconds, redisClientProvider);

      if (!locked) {
        throw AppError.conflict('A request with this idempotency key is already processing.');
      }

      request.idempotencyResponseKey = responseKey;
      request.idempotencyLockKey = lockKey;

      reply.header('Idempotency-Status', 'created');
    },

    async onSend(request, reply, payload) {
      if (!request.idempotencyResponseKey) {
        return payload;
      }

      try {
        if (reply.statusCode >= 200 && reply.statusCode < 500 && payload !== undefined) {
          const body = parsePayload(payload);

          if (body !== undefined) {
            await writeStoredJson(
              request.idempotencyResponseKey,
              { statusCode: reply.statusCode, body },
              ttlSeconds,
              redisClientProvider
            );
          }
        }
      } finally {
        await releaseLock(request.idempotencyLockKey, redisClientProvider);
      }

      return payload;
    },
  };
}

function validate(schemaMap = {}) {
  return function validationPreHandler(request, _reply, done) {
    try {
      for (const [location, schema] of Object.entries(schemaMap)) {
        if (!schema) {
          continue;
        }

        const source = location === 'query' ? 'query' : location;
        const result = schema.safeParse(request[source]);

        if (!result.success) {
          done(AppError.validation('Validation failed', normalizeZodErrors(result.error)));
          return;
        }

        request[source] = result.data;
      }

      done();
    } catch (error) {
      done(error);
    }
  };
}

function asyncHandler(handler) {
  return async function wrappedAsyncHandler(request, reply) {
    return handler(request, reply);
  };
}

function authenticateJwt(options = {}) {
  return createJwtAuthHook(options);
}

function authorize(options = {}) {
  return createAuthorizationHook(options);
}

function authorizeRoles(...roles) {
  return createRoleAuthorizationHook(...roles);
}

function verifyInternalRequest(options = {}) {
  return createInternalAuthHook(options);
}

function notFoundHandler(options = {}) {
  const serviceName = options.serviceName || 'service';

  return function notFound(request, reply) {
    return reply.fail({
      statusCode: HTTP_STATUS.NOT_FOUND,
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: `${serviceName} route not found: ${request.method} ${request.originalUrl || request.url}`,
    });
  };
}

async function incrementCounter(key, windowMs, redisClientProvider) {
  const redis = await getRedisClient(redisClientProvider);

  if (redis) {
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.pExpire(key, windowMs);
    }

    return count;
  }

  const now = Date.now();
  const record = memoryRateLimitStore.get(key);

  if (!record || record.expiresAt <= now) {
    memoryRateLimitStore.set(key, { count: 1, expiresAt: now + windowMs });
    cleanupExpired(memoryRateLimitStore, now);

    return 1;
  }

  record.count += 1;

  return record.count;
}

async function getRedisClient(provider) {
  if (!provider) {
    return null;
  }

  try {
    const client = await provider();

    if (client?.isReady) {
      return client;
    }

    if (client?.isOpen && typeof client.ping === 'function') {
      await client.ping();

      return client;
    }
  } catch (_error) {
    return null;
  }

  return null;
}

async function readStoredJson(key, redisClientProvider) {
  const redis = await getRedisClient(redisClientProvider);

  if (redis) {
    const raw = await redis.get(key);

    return raw ? JSON.parse(raw) : null;
  }

  const record = memoryCacheStore.get(key) || memoryIdempotencyStore.get(key);

  if (!record || record.expiresAt <= Date.now()) {
    memoryCacheStore.delete(key);
    memoryIdempotencyStore.delete(key);

    return null;
  }

  return record.value;
}

async function writeStoredJson(key, value, ttlSeconds, redisClientProvider) {
  const redis = await getRedisClient(redisClientProvider);

  if (redis) {
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });

    return;
  }

  const targetStore = key.includes('idempotency') ? memoryIdempotencyStore : memoryCacheStore;

  targetStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  cleanupExpired(targetStore);
}

async function acquireLock(key, value, ttlSeconds, redisClientProvider) {
  const redis = await getRedisClient(redisClientProvider);

  if (redis) {
    const result = await redis.set(key, value, { NX: true, EX: ttlSeconds });

    return result === 'OK';
  }

  const existing = memoryIdempotencyStore.get(key);

  if (existing && existing.expiresAt > Date.now()) {
    return false;
  }

  memoryIdempotencyStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  return true;
}

async function releaseLock(key, redisClientProvider) {
  if (!key) {
    return;
  }

  const redis = await getRedisClient(redisClientProvider);

  if (redis) {
    await redis.del(key);

    return;
  }

  memoryIdempotencyStore.delete(key);
}

function cleanupExpired(store, now = Date.now()) {
  if (store.size < 1000) {
    return;
  }

  for (const [key, value] of store.entries()) {
    if (value.expiresAt <= now) {
      store.delete(key);
    }
  }
}

function sanitizeHeaderValue(value) {
  if (!value) {
    return null;
  }

  const headerValue = Array.isArray(value) ? value[0] : value;

  return String(headerValue).trim().slice(0, 128) || null;
}

function parsePayload(payload) {
  if (payload === undefined || payload === null) {
    return undefined;
  }

  if (Buffer.isBuffer(payload)) {
    return JSON.parse(payload.toString('utf8'));
  }

  if (typeof payload === 'string') {
    return JSON.parse(payload);
  }

  return payload;
}

function hashValue(value) {
  return require('crypto')
    .createHash('sha256')
    .update(String(value))
    .digest('hex');
}

function createCircuitBreaker(name, options = {}) {
  if (circuitRegistry.has(name)) {
    return circuitRegistry.get(name);
  }

  const failureThreshold = Number(options.failureThreshold || process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || 5);
  const resetTimeoutMs = Number(options.resetTimeoutMs || process.env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS || 30000);
  const halfOpenMaxConcurrent = Number(options.halfOpenMaxConcurrent || process.env.CIRCUIT_BREAKER_HALF_OPEN_MAX_CONCURRENT || 1);

  const state = {
    name,
    status: 'CLOSED',
    failures: 0,
    openedAt: 0,
    lastFailureAt: 0,
    lastSuccessAt: 0,
    lastError: null,
    halfOpenInFlight: 0,
  };

  const breaker = {
    canRequest() {
      if (state.status === 'CLOSED') {
        return true;
      }

      if (state.status === 'OPEN') {
        if (Date.now() - state.openedAt < resetTimeoutMs) {
          return false;
        }

        state.status = 'HALF_OPEN';
        state.halfOpenInFlight = 0;
      }

      if (state.halfOpenInFlight >= halfOpenMaxConcurrent) {
        return false;
      }

      state.halfOpenInFlight += 1;

      return true;
    },

    recordSuccess() {
      state.status = 'CLOSED';
      state.failures = 0;
      state.openedAt = 0;
      state.lastSuccessAt = Date.now();
      state.lastError = null;
      state.halfOpenInFlight = 0;
    },

    recordFailure(error) {
      state.lastFailureAt = Date.now();
      state.lastError = error?.code || error?.message || error?.statusCode || 'failure';
      state.halfOpenInFlight = Math.max(0, state.halfOpenInFlight - 1);

      if (state.status === 'HALF_OPEN') {
        state.status = 'OPEN';
        state.openedAt = Date.now();
        state.failures = failureThreshold;

        return;
      }

      state.failures += 1;

      if (state.failures >= failureThreshold) {
        state.status = 'OPEN';
        state.openedAt = Date.now();
      }
    },

    getState() {
      return { ...state };
    },

    async execute(operation) {
      if (!this.canRequest()) {
        throw AppError.serviceUnavailable('Downstream service is temporarily unavailable.');
      }

      try {
        const result = await operation();

        this.recordSuccess();

        return result;
      } catch (error) {
        this.recordFailure(error);

        throw error;
      }
    },
  };

  circuitRegistry.set(name, breaker);

  return breaker;
}

function getCircuitBreakerStates() {
  return Array.from(circuitRegistry.values()).map((breaker) => breaker.getState());
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryError(error) {
  const status = error.response?.status || error.statusCode;

  return (
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ECONNABORTED' ||
    status === 408 ||
    status === 429 ||
    status >= 500
  );
}

async function withRetry(operation, options = {}) {
  const retries = Number(options.retries ?? process.env.RETRY_ATTEMPTS ?? 2);
  const baseDelayMs = Number(options.baseDelayMs ?? process.env.RETRY_BASE_DELAY_MS ?? 100);
  const shouldRetry = options.shouldRetry || shouldRetryError;

  let attempt = 0;

  while (true) {
    try {
      return await operation(attempt);
    } catch (error) {
      if (attempt >= retries || !shouldRetry(error, attempt)) {
        throw error;
      }

      attempt += 1;

      const jitterMs = Math.floor(Math.random() * Math.max(1, baseDelayMs));

      await delay(baseDelayMs * 2 ** (attempt - 1) + jitterMs);
    }
  }
}

function getServiceAgent(target) {
  return String(target || '').startsWith('https://')
    ? new https.Agent({ keepAlive: true })
    : new http.Agent({ keepAlive: true });
}

module.exports = {
  AppError,
  ERROR_CODES,
  HTTP_STATUS,

  applyStandardOpenApiResponses,
  asyncHandler,
  authPlugin,
  authenticateJwt,
  authorize,
  authorizeRoles,

  buildAccessTokenPayload,
  buildCursorPagination,
  buildErrorResponse,
  buildPagePagination,
  buildResponseMeta,
  buildSuccessResponse,
  buildTrustedUserHeaders,
  buildUserContext,

  codeFromStatus,
  commonResponses,
  commonSchemas,

  createBackpressureHook,
  createCacheHooks,
  createCircuitBreaker,
  createDbErrorLoggerHook,
  createFastifyApp,
  createIdempotencyHooks,
  createRateLimitHook,
  createRefreshToken,
  createRequestLoggerHook,
  createRequestFinishedLoggerHook,

  getCircuitBreakerStates,
  getInternalRequestContext,
  getCommonOpenApiComponents,
  getServiceAgent,

  hashRefreshToken,
  INTERNAL_CONTEXT_HEADERS,

  mergeCommonOpenApiComponents,
  messageFromStatus,
  normalizeDetails,
  normalizeError,
  normalizePagination,

  notFoundHandler,
  parseBytes,
  registerSwagger,
  sanitizeJson,

  resolveJwtConfig,
  signAccessToken,
  stripInternalAuthHeaders,

  validate,
  verifyInternalRequest,
  verifyJwtToken,
  withRetry,
};
