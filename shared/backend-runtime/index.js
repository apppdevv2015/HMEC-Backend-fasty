const crypto = require('crypto');
const http = require('http');
const https = require('https');
const querystring = require('querystring');

const DEFAULT_ERROR_MESSAGE = 'Internal server error.';
const memoryRateLimitStore = new Map();
const memoryCacheStore = new Map();
const memoryIdempotencyStore = new Map();
const circuitRegistry = new Map();

const {
  requestContextMiddleware,
} = require('../logger/requestContext.middleware');

const logger = require('../logger/logger');

class AppError extends Error {
  constructor(message = DEFAULT_ERROR_MESSAGE, statusCode = 500, details = undefined, options = {}) {
    if (typeof statusCode === 'object' && statusCode !== null) {
      options = statusCode;
      statusCode = options.statusCode || 500;
      details = options.details;
    }

    super(message);
    this.name = options.name || 'AppError';
    this.statusCode = statusCode;
    this.code = options.code || codeFromStatus(statusCode);
    this.errors = options.errors || details || [];
    this.details = details;
    this.isOperational = options.isOperational !== false;
    this.expose = options.expose ?? statusCode < 500;
  }

  static badRequest(message = 'Bad request.', details) {
    return new AppError(message, 400, details, { code: 'BAD_REQUEST' });
  }

  static validation(message = 'Validation failed', errors = []) {
    return new AppError(message, 400, errors, {
      code: 'VALIDATION_ERROR',
      errors,
    });
  }

  static unauthorized(message = 'Authentication is required.') {
    return new AppError(message, 401, undefined, { code: 'UNAUTHORIZED' });
  }

  static forbidden(message = 'Forbidden.') {
    return new AppError(message, 403, undefined, { code: 'FORBIDDEN' });
  }

  static notFound(message = 'Resource not found.') {
    return new AppError(message, 404, undefined, { code: 'NOT_FOUND' });
  }

  static conflict(message = 'Resource already exists.', details) {
    return new AppError(message, 409, details, { code: 'CONFLICT' });
  }

  static payloadTooLarge(message = 'Request body is too large.') {
    return new AppError(message, 413, undefined, { code: 'PAYLOAD_TOO_LARGE' });
  }

  static rateLimited(message = 'Too many requests. Please try again later.') {
    return new AppError(message, 429, undefined, { code: 'RATE_LIMIT_EXCEEDED' });
  }

  static timeout(message = 'Request timed out.') {
    return new AppError(message, 504, undefined, { code: 'REQUEST_TIMEOUT' });
  }

  static external(message = 'Downstream service request failed.', details) {
    return new AppError(message, 502, details, {
      code: 'EXTERNAL_API_FAILURE',
      expose: true,
    });
  }

  static serviceUnavailable(message = 'Service temporarily unavailable.', details) {
    return new AppError(message, 503, details, {
      code: 'SERVICE_UNAVAILABLE',
      expose: true,
    });
  }

  static database(message = 'Database operation failed.', details) {
    return new AppError(message, 500, details, {
      code: 'DATABASE_ERROR',
      expose: false,
    });
  }

  static internal(message = DEFAULT_ERROR_MESSAGE, details) {
    return new AppError(message, 500, details, {
      code: 'INTERNAL_ERROR',
      expose: false,
    });
  }
}

function asyncHandler(handler) {
  return function wrappedAsyncHandler(req, res, next) {
    return Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function codeFromStatus(statusCode) {
  const codes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    408: 'REQUEST_TIMEOUT',
    409: 'CONFLICT',
    413: 'PAYLOAD_TOO_LARGE',
    422: 'VALIDATION_ERROR',
    429: 'RATE_LIMIT_EXCEEDED',
    500: 'INTERNAL_ERROR',
    502: 'EXTERNAL_API_FAILURE',
    503: 'SERVICE_UNAVAILABLE',
    504: 'REQUEST_TIMEOUT',
  };

  return codes[statusCode] || 'ERROR';
}

function messageFromStatus(statusCode) {
  const messages = {
    400: 'Bad request.',
    401: 'Authentication is required.',
    403: 'Forbidden.',
    404: 'Resource not found.',
    408: 'Request timed out.',
    409: 'Resource already exists.',
    413: 'Request body is too large.',
    422: 'Validation failed',
    429: 'Too many requests. Please try again later.',
    500: DEFAULT_ERROR_MESSAGE,
    502: 'Downstream service request failed.',
    503: 'Service temporarily unavailable.',
    504: 'Request timed out.',
  };

  return messages[statusCode] || DEFAULT_ERROR_MESSAGE;
}

function getTraceId(req) {
  return (
    req?.traceId ||
    req?.requestId ||
    req?.headers?.['x-trace-id'] ||
    req?.headers?.['x-correlation-id'] ||
    req?.headers?.['x-request-id'] ||
    crypto.randomUUID()
  );
}

function attachRequestContext(options = {}) {
  const headerName = options.headerName || 'x-request-id';

  return function requestContext(req, res, next) {
    const incomingTraceId =
      req.headers['x-trace-id'] ||
      req.headers['x-correlation-id'] ||
      req.headers[headerName];
    const traceId = sanitizeHeaderValue(incomingTraceId) || crypto.randomUUID();

    req.traceId = traceId;
    req.requestId = traceId;
    req.startTime = Date.now();
    req.serviceName = options.serviceName || req.serviceName;
    req.abortController = new AbortController();

    res.setHeader('X-Trace-Id', traceId);
    res.setHeader('X-Request-Id', traceId);
    res.setHeader('X-Correlation-Id', traceId);

    return next();
  };
}

function sanitizeHeaderValue(value) {
  if (!value) {
    return null;
  }

  const headerValue = Array.isArray(value) ? value[0] : value;
  return String(headerValue).trim().slice(0, 128) || null;
}

function createResponseFormatter(options = {}) {
  return function responseFormatter(req, res, next) {
    res.success = function success(data = null, message = 'OK', statusCode = 200, meta = undefined) {
      return res.status(statusCode).json({
        success: true,
        message,
        data,
        ...(meta ? { meta } : {}),
        traceId: getTraceId(req),
      });
    };

    const originalJson = res.json.bind(res);

    res.json = function formattedJson(body) {
      if (body && body.success === false) {
        const statusCode = res.statusCode >= 400 ? res.statusCode : body.statusCode || 500;
        return originalJson(normalizeErrorBody(body, statusCode, getTraceId(req)));
      }

      return originalJson(body);
    };

    return next();
  };
}

function normalizeErrorBody(body, statusCode, traceId) {
  const isServerError = statusCode >= 500;
  const message = isServerError
    ? messageFromStatus(statusCode)
    : body.message || messageFromStatus(statusCode);

  return {
    success: false,
    message,
    code: body.code || codeFromStatus(statusCode),
    errors: normalizeErrors(body.errors || body.details || body.error || []),
    traceId,
  };
}

function normalizeErrors(errors) {
  if (!errors) {
    return [];
  }

  if (Array.isArray(errors)) {
    return errors;
  }

  if (typeof errors === 'object') {
    return [errors];
  }

  return [];
}

function createRequestLogger(options = {}) {
  const serviceName = options.serviceName || 'service';
  const logger = options.logger || console;
  const skip = options.skip || ((req) => req.originalUrl.toLowerCase().includes('health'));

  return function requestLogger(req, res, next) {
    if (skip(req)) {
      return next();
    }

    const startedAt = Date.now();
    const traceId = getTraceId(req);

    writeLog(logger, 'info', 'request_started', {
      service: serviceName,
      traceId,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
    });

    res.on('finish', () => {
      writeLog(logger, res.statusCode >= 500 ? 'error' : 'info', 'request_finished', {
        service: serviceName,
        traceId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });

    return next();
  };
}

function writeLog(logger, level, message, meta) {
  const safeMeta = redactMeta(meta);

  if (typeof logger[level] === 'function') {
    logger[level](message, safeMeta);
    return;
  }

  console.log(JSON.stringify({ level, message, ...safeMeta }));
}

function redactMeta(meta = {}) {
  const blockedKeys = new Set(['authorization', 'cookie', 'password', 'token', 'secret']);

  return Object.entries(meta).reduce((acc, [key, value]) => {
    if (blockedKeys.has(String(key).toLowerCase())) {
      acc[key] = '[REDACTED]';
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {});
}

function createCompressionMiddleware(options = {}) {
  try {
    const compression = require('compression');
    return compression({
      threshold: Number(options.threshold || process.env.COMPRESSION_THRESHOLD_BYTES || 1024),
      filter: options.filter,
    });
  } catch (_error) {
    return function compressionUnavailable(_req, _res, next) {
      return next();
    };
  }
}

function createTimeoutMiddleware(options = {}) {
  const timeoutMs = Number(options.timeoutMs || process.env.REQUEST_TIMEOUT_MS || 30000);
  const skip = options.skip || ((req) => req.originalUrl.toLowerCase().includes('health'));

  return function requestTimeout(req, res, next) {
    if (skip(req)) {
      return next();
    }

    let completed = false;

    const timer = setTimeout(() => {
      if (completed || res.headersSent) {
        return;
      }

      req.timedout = true;
      req.abortController?.abort();
      next(AppError.timeout());
    }, timeoutMs);

    timer.unref?.();

    res.on('finish', () => {
      completed = true;
      clearTimeout(timer);
    });

    res.on('close', () => {
      completed = true;
      clearTimeout(timer);
      req.abortController?.abort();
    });

    return next();
  };
}

function createBackpressureMiddleware(options = {}) {
  const maxInflight = Number(options.maxInflight || process.env.MAX_INFLIGHT_REQUESTS || 1000);
  const skip = options.skip || ((req) => req.originalUrl.toLowerCase().includes('health'));
  let inflight = 0;

  return function backpressure(req, res, next) {
    if (skip(req)) {
      return next();
    }

    if (inflight >= maxInflight) {
      return next(AppError.serviceUnavailable('Server is busy. Please retry shortly.'));
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

    res.on('finish', release);
    res.on('close', release);

    return next();
  };
}

function createRateLimitMiddleware(options = {}) {
  const windowMs = Number(options.windowMs || process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
  const max = Number(options.max || process.env.RATE_LIMIT_MAX || 300);
  const keyPrefix = options.keyPrefix || 'rate-limit';
  const skip = options.skip || ((req) => req.originalUrl.toLowerCase().includes('health'));
  const redisClientProvider = options.redisClientProvider;

  return async function rateLimiter(req, res, next) {
    if (skip(req)) {
      return next();
    }

    const key = `${keyPrefix}:${hashValue(`${req.ip}:${req.headers.authorization || ''}`)}`;

    try {
      const count = await incrementCounter(key, windowMs, redisClientProvider);
      const remaining = Math.max(0, max - count);

      res.setHeader('RateLimit-Limit', String(max));
      res.setHeader('RateLimit-Remaining', String(remaining));
      res.setHeader('RateLimit-Reset', String(Math.ceil(windowMs / 1000)));

      if (count > max) {
        return next(AppError.rateLimited(options.message));
      }

      return next();
    } catch (_error) {
      return next();
    }
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

function createIdempotencyMiddleware(options = {}) {
  const ttlSeconds = Number(options.ttlSeconds || process.env.IDEMPOTENCY_TTL_SECONDS || 24 * 60 * 60);
  const redisClientProvider = options.redisClientProvider;
  const keyPrefix = options.keyPrefix || 'idempotency';
  const methods = new Set(options.methods || ['POST', 'PUT', 'PATCH', 'DELETE']);

  return async function idempotency(req, res, next) {
    if (!methods.has(req.method)) {
      return next();
    }

    const idempotencyKey = sanitizeHeaderValue(
      req.headers['idempotency-key'] || req.headers['x-idempotency-key']
    );

    if (!idempotencyKey) {
      return next();
    }

    const fingerprint = hashValue(JSON.stringify({
      method: req.method,
      url: req.originalUrl,
      auth: req.headers.authorization || '',
      body: req.body || {},
    }));
    const baseKey = `${keyPrefix}:${idempotencyKey}:${fingerprint}`;
    const responseKey = `${baseKey}:response`;
    const lockKey = `${baseKey}:lock`;

    try {
      const cached = await readStoredJson(responseKey, redisClientProvider);

      if (cached) {
        res.setHeader('Idempotency-Status', 'cached');
        return res.status(cached.statusCode).json(cached.body);
      }

      const locked = await acquireLock(lockKey, getTraceId(req), ttlSeconds, redisClientProvider);

      if (!locked) {
        return next(AppError.conflict('A request with this idempotency key is already processing.'));
      }

      let responseBody;
      const originalJson = res.json.bind(res);

      res.json = function idempotentJson(body) {
        responseBody = body;
        return originalJson(body);
      };

      res.on('finish', async () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 500 && responseBody !== undefined) {
            await writeStoredJson(
              responseKey,
              {
                statusCode: res.statusCode,
                body: responseBody,
              },
              ttlSeconds,
              redisClientProvider
            );
          }
        } finally {
          await releaseLock(lockKey, redisClientProvider);
        }
      });

      res.setHeader('Idempotency-Status', 'created');
      return next();
    } catch (_error) {
      return next();
    }
  };
}

function createCacheMiddleware(options = {}) {
  const ttlSeconds = Number(options.ttlSeconds || process.env.GET_CACHE_TTL_SECONDS || 0);
  const redisClientProvider = options.redisClientProvider;
  const keyPrefix = options.keyPrefix || 'http-cache';
  const enabled = options.enabled ?? String(process.env.ENABLE_HTTP_CACHE || 'false').toLowerCase() === 'true';
  const skip = options.skip || ((req) => req.originalUrl.toLowerCase().includes('health'));

  return async function cache(req, res, next) {
    if (!enabled || ttlSeconds <= 0 || !['GET', 'HEAD'].includes(req.method) || skip(req)) {
      return next();
    }

    const cacheKey = `${keyPrefix}:${hashValue(JSON.stringify({
      method: req.method,
      url: req.originalUrl,
      authorization: req.headers.authorization || '',
      accept: req.headers.accept || '',
    }))}`;

    try {
      const cached = await readStoredJson(cacheKey, redisClientProvider);

      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(cached.statusCode).json(cached.body);
      }

      let responseBody;
      const originalJson = res.json.bind(res);

      res.json = function cachedJson(body) {
        responseBody = body;
        return originalJson(body);
      };

      res.on('finish', async () => {
        if (res.statusCode === 200 && responseBody !== undefined) {
          await writeStoredJson(
            cacheKey,
            { statusCode: res.statusCode, body: responseBody },
            ttlSeconds,
            redisClientProvider
          );
        }
      });

      res.setHeader('X-Cache', 'MISS');
      return next();
    } catch (_error) {
      return next();
    }
  };
}

function validate(schemaMap = {}) {
  return function validationMiddleware(req, _res, next) {
    try {
      for (const [location, schema] of Object.entries(schemaMap)) {
        if (!schema) {
          continue;
        }

        const result = schema.safeParse(req[location]);

        if (!result.success) {
          return next(AppError.validation('Validation failed', formatZodErrors(result.error)));
        }

        req[location] = result.data;
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

function authenticateJwt(options = {}) {
  const jwt = options.jwt || require('jsonwebtoken');

  return function auth(req, _res, next) {
    const secret = options.secret || process.env.JWT_SECRET;
    const authHeader = req.headers.authorization || '';

    if (!secret) {
      return next(AppError.internal('JWT secret is not configured.'));
    }

    if (!authHeader.startsWith('Bearer ')) {
      return next(AppError.unauthorized('Missing bearer token.'));
    }

    try {
      const token = authHeader.slice('Bearer '.length).trim();
      const decoded = jwt.verify(token, secret);
      req.auth = decoded;
      req.user = decoded;
      return next();
    } catch (_error) {
      return next(AppError.unauthorized('Invalid or expired token.'));
    }
  };
}

function authorizeRoles(...roles) {
  return function roleAuthorization(req, _res, next) {
    const role = req.auth?.role || req.user?.role;

    if (!role) {
      return next(AppError.unauthorized('Authentication is required.'));
    }

    if (!roles.includes(role)) {
      return next(AppError.forbidden('You do not have access to this resource.'));
    }

    return next();
  };
}

function notFoundMiddleware(options = {}) {
  const serviceName = options.serviceName || 'service';

  return function notFound(req, _res, next) {
    return next(AppError.notFound(`${serviceName} route not found: ${req.method} ${req.originalUrl}`));
  };
}

function globalErrorHandler(options = {}) {
  const serviceName = options.serviceName || 'service';
  const logger = options.logger || console;

  return function errorHandler(error, req, res, next) {
    if (res.headersSent) {
      return next(error);
    }

    const normalized = normalizeError(error);
    const traceId = getTraceId(req);

    writeLog(logger, normalized.statusCode >= 500 ? 'error' : 'warn', 'request_error', {
      service: serviceName,
      traceId,
      method: req.method,
      path: req.originalUrl,
      statusCode: normalized.statusCode,
      code: normalized.code,
      message: normalized.internalMessage || normalized.message,
      stack: normalized.statusCode >= 500 ? error.stack : undefined,
    });

    return res.status(normalized.statusCode).json({
      success: false,
      message: normalized.message,
      code: normalized.code,
      errors: normalized.errors,
      traceId,
    });
  };
}

function normalizeError(error) {
  // Handle specific HME limit error messages thrown as raw Errors
  const message = error?.message || '';
  if (
    message.includes('COMPANY_ADMIN_LIMIT_REACHED') ||
    message.includes('STAFF_LIMIT_REACHED') ||
    message.includes('DEMO_ALREADY_USED') ||
    message.includes('limit reached') || 
    message.includes('Limit reached')
  ) {
    let code = 'BUSINESS_RULE_FAILED';
    if (message.includes('COMPANY_ADMIN_LIMIT_REACHED')) {
      code = 'COMPANY_ADMIN_LIMIT_REACHED';
    } else if (message.includes('STAFF_LIMIT_REACHED')) {
      code = 'STAFF_LIMIT_REACHED';
    } else if (message.includes('DEMO_ALREADY_USED')) {
      code = 'DEMO_ALREADY_USED';
    } else {
      code = 'SUBSCRIPTION_LIMIT_REACHED';
    }
    return {
      statusCode: 422,
      code,
      message,
      errors: [],
      internalMessage: message,
    };
  }

  if (error instanceof AppError || error?.statusCode) {
    const statusCode = Number(error.statusCode || 500);
    return {
      statusCode,
      code: error.code || codeFromStatus(statusCode),
      message: error.expose === false || statusCode >= 500
        ? messageFromStatus(statusCode)
        : error.message || messageFromStatus(statusCode),
      errors: normalizeErrors(error.errors || error.details),
      internalMessage: error.message,
    };
  }

  if (error?.name === 'ZodError') {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors: formatZodErrors(error),
      internalMessage: error.message,
    };
  }

  if (error?.type === 'entity.too.large' || error?.status === 413) {
    return {
      statusCode: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Request body is too large.',
      errors: [],
      internalMessage: error.message,
    };
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return {
      statusCode: 400,
      code: 'INVALID_JSON',
      message: 'Malformed JSON request body.',
      errors: [],
      internalMessage: error.message,
    };
  }

  if (error?.code && String(error.code).startsWith('P')) {
    return normalizePrismaError(error);
  }

  if (error?.isAxiosError) {
    return normalizeAxiosError(error);
  }

  if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
    return {
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token.',
      errors: [],
      internalMessage: error.message,
    };
  }

  if (error?.message === 'Origin not allowed by CORS policy') {
    return {
      statusCode: 403,
      code: 'CORS_FORBIDDEN',
      message: 'Origin is not allowed.',
      errors: [error],
      internalMessage: error.message,
    };
  }

  return {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: DEFAULT_ERROR_MESSAGE,
    errors: [error],
    internalMessage: error?.message || DEFAULT_ERROR_MESSAGE,
  };
}

function normalizePrismaError(error) {
  if (error.code === 'P2002') {
    return {
      statusCode: 409,
      code: 'DUPLICATE_RESOURCE',
      message: 'A record with these details already exists.',
      errors: normalizeErrors(error.meta?.target ? { target: error.meta.target } : []),
      internalMessage: error.message,
    };
  }

  if (error.code === 'P2025') {
    return {
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Resource not found.',
      errors: [],
      internalMessage: error.message,
    };
  }

  if (error.code === 'P2003') {
    return {
      statusCode: 400,
      code: 'FOREIGN_KEY_CONSTRAINT',
      message: 'Referenced resource does not exist.',
      errors: [],
      internalMessage: error.message,
    };
  }

  if (['P1001', 'P1002', 'P1008'].includes(error.code)) {
    return {
      statusCode: 503,
      code: 'DATABASE_UNAVAILABLE',
      message: 'Database is temporarily unavailable.',
      errors: [],
      internalMessage: error.message,
    };
  }

  return {
    statusCode: 500,
    code: 'DATABASE_ERROR',
    message: DEFAULT_ERROR_MESSAGE,
    errors: [],
    internalMessage: error.message,
  };
}

function normalizeAxiosError(error) {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return {
      statusCode: 504,
      code: 'EXTERNAL_TIMEOUT',
      message: 'Downstream service timed out.',
      errors: [],
      internalMessage: error.message,
    };
  }

  const responseStatus = error.response?.status;
  const statusCode = responseStatus && responseStatus < 500 ? responseStatus : 502;

  return {
    statusCode,
    code: statusCode >= 500 ? 'EXTERNAL_API_FAILURE' : codeFromStatus(statusCode),
    message: statusCode >= 500
      ? 'Downstream service request failed.'
      : error.response?.data?.message || messageFromStatus(statusCode),
    errors: normalizeErrors(error.response?.data?.errors),
    internalMessage: error.message,
  };
}

function formatZodErrors(error) {
  if (!error?.issues) {
    return normalizeErrors(error?.flatten?.() || error);
  }

  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}

async function getRedisClient(provider) {
  if (!provider) {
    return null;
  }

  try {
    const client = await provider();

    if (client?.isOpen || client?.isReady) {
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

function hashValue(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
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
      await delay(baseDelayMs * 2 ** (attempt - 1));
    }
  }
}

function createCircuitBreaker(name, options = {}) {
  if (circuitRegistry.has(name)) {
    return circuitRegistry.get(name);
  }

  const failureThreshold = Number(options.failureThreshold || process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || 5);
  const resetTimeoutMs = Number(options.resetTimeoutMs || process.env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS || 30000);
  const state = {
    name,
    status: 'CLOSED',
    failures: 0,
    openedAt: 0,
  };

  const breaker = {
    canRequest() {
      if (state.status !== 'OPEN') {
        return true;
      }

      if (Date.now() - state.openedAt >= resetTimeoutMs) {
        state.status = 'HALF_OPEN';
        return true;
      }

      return false;
    },
    recordSuccess() {
      state.status = 'CLOSED';
      state.failures = 0;
      state.openedAt = 0;
    },
    recordFailure() {
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
        this.recordFailure();
        throw error;
      }
    },
  };

  circuitRegistry.set(name, breaker);
  return breaker;
}

module.exports = {
  AppError,
  asyncHandler,
  attachRequestContext,
  authenticateJwt,
  authorizeRoles,
  createBackpressureMiddleware,
  createCacheMiddleware,
  createCircuitBreaker,
  createCompressionMiddleware,
  createIdempotencyMiddleware,
  createRateLimitMiddleware,
  createRequestLogger,
  createResponseFormatter,
  createTimeoutMiddleware,
  globalErrorHandler,
  notFoundMiddleware,
  normalizeError,
  validate,
  withRetry,
};
