const axios = require('axios');
const querystring = require('querystring');
const { buildInternalHeaders } = require('../config/internal-request');
const { getServiceAgent } = require('../integrations/service-client');
const { AppError, createCircuitBreaker, stripInternalAuthHeaders } = require('../runtime');

const PROXY_TIMEOUT_MS = Number(process.env.PROXY_TIMEOUT_MS || 15000);
const PROXY_RETRY_ATTEMPTS = Number(process.env.PROXY_RETRY_ATTEMPTS || 1);
const PROXY_RETRY_BASE_DELAY_MS = Number(process.env.PROXY_RETRY_BASE_DELAY_MS || 75);
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'DELETE']);
const TRANSIENT_STATUS_CODES = new Set([408, 429, 502, 503, 504]);
const TRANSIENT_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNABORTED',
  'ETIMEDOUT',
  'EPIPE',
  'ENOTFOUND',
  'EAI_AGAIN',
]);
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'expect',
  'host',
  'keep-alive',
  'origin',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function isEnabled(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function shouldNormalizeProxyCompression() {
  return isEnabled(process.env.LOCAL_DEV) || isEnabled(process.env.PROXY_NORMALIZE_COMPRESSION);
}

function shouldSkipRequestHeader(headerName) {
  if (HOP_BY_HOP_HEADERS.has(headerName)) {
    return true;
  }

  return headerName === 'accept-encoding' && shouldNormalizeProxyCompression();
}

function shouldSkipResponseHeader(headerName) {
  if (HOP_BY_HOP_HEADERS.has(headerName) || headerName === 'set-cookie') {
    return true;
  }

  return headerName === 'content-encoding' && shouldNormalizeProxyCompression();
}

function serializeBody(request) {
  if (!request.body || ['GET', 'HEAD'].includes(request.method)) {
    return undefined;
  }

  if (Buffer.isBuffer(request.body) || typeof request.body === 'string') {
    return request.body;
  }

  const contentType = String(request.headers['content-type'] || '').toLowerCase();

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return querystring.stringify(request.body);
  }

  return request.body;
}

function buildTargetPath(request, sourcePrefix, targetPrefix = '/api/v1') {
  const originalUrl = request.originalUrl || request.url || '/';
  const [pathname, search = ''] = originalUrl.split('?');
  let rewrittenPath;

  if (sourcePrefix && pathname.startsWith(sourcePrefix)) {
    rewrittenPath = `${targetPrefix}${pathname.slice(sourcePrefix.length)}`;
  } else if (pathname.startsWith(targetPrefix)) {
    rewrittenPath = pathname;
  } else if (pathname.startsWith('/')) {
    rewrittenPath = `${targetPrefix}${pathname}`;
  } else {
    rewrittenPath = `${targetPrefix}/${pathname}`;
  }

  const normalizedPath = rewrittenPath.replace(/\/{2,}/g, '/');
  return search ? `${normalizedPath}?${search}` : normalizedPath;
}

function buildHeaders(request) {
  const headers = {};
  const safeIncomingHeaders = stripInternalAuthHeaders(request.headers || {});

  for (const [key, value] of Object.entries(safeIncomingHeaders)) {
    if (!shouldSkipRequestHeader(String(key).toLowerCase())) {
      headers[key] = value;
    }
  }

  return {
    ...headers,
    ...buildInternalHeaders(request),
  };
}

function parseProxyBody(response) {
  const contentType = String(response.headers?.['content-type'] || '').toLowerCase();
  const data = response.data;

  if (response.status === 204 || response.status === 205 || data === undefined || data === null) {
    return null;
  }

  if (contentType.includes('application/json')) {
    const raw = Buffer.isBuffer(data) ? data.toString('utf8') : String(data || '');

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (_error) {
      return raw;
    }
  }

  return data;
}

function copyResponseHeaders(response, reply) {
  for (const [key, value] of Object.entries(response.headers || {})) {
    const headerName = String(key).toLowerCase();

    if (!shouldSkipResponseHeader(headerName)) {
      reply.header(key, value);
    }
  }
}

function sendProxyError(reply, statusCode, body) {
  return reply.fail({
    statusCode,
    code: body?.error?.code || body?.code,
    message: body?.message || 'Downstream service request failed',
    data: body?.data,
    details: body?.error?.details || body?.errors || body?.details,
  });
}

function normalizeProxyTarget(input, sourcePrefix, targetPrefix) {
  if (typeof input === 'string') {
    return {
      target: input,
      sourcePrefix,
      targetPrefix,
    };
  }

  return {
    target: input?.target,
    sourcePrefix: input?.sourcePrefix ?? sourcePrefix,
    targetPrefix: input?.targetPrefix ?? targetPrefix,
  };
}

function createProxyClientCache() {
  const clients = new Map();

  return function getProxyClient(target) {
    if (clients.has(target)) {
      return clients.get(target);
    }

    const agent = getServiceAgent(target);
    const client = axios.create({
      baseURL: target,
      timeout: PROXY_TIMEOUT_MS,
      httpAgent: agent,
      httpsAgent: agent,
      responseType: 'arraybuffer',
      validateStatus: () => true,
    });

    clients.set(target, client);
    return client;
  };
}

function normalizeBreakerPath(pathName) {
  return String(pathName || '/')
    .split('?')[0]
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/\d+(?=\/|$)/g, '/:id')
    .replace(/\/{2,}/g, '/')
    .replace(/\/+$/, '') || '/';
}

function canRetryProxyRequest(request) {
  return (
    IDEMPOTENT_METHODS.has(String(request.method || '').toUpperCase()) ||
    Boolean(request.headers['idempotency-key'] || request.headers['x-idempotency-key'])
  );
}

function shouldRetryProxyError(error) {
  return TRANSIENT_ERROR_CODES.has(error?.code);
}

function shouldRetryProxyResponse(response) {
  return TRANSIENT_STATUS_CODES.has(Number(response?.status));
}

function retryDelay(attempt) {
  const jitterMs = Math.floor(Math.random() * Math.max(1, PROXY_RETRY_BASE_DELAY_MS));
  return PROXY_RETRY_BASE_DELAY_MS * 2 ** attempt + jitterMs;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestWithRetry(client, config, request) {
  const canRetry = canRetryProxyRequest(request);
  let attempt = 0;

  while (true) {
    try {
      const response = await client.request({
        ...config,
        headers: {
          ...config.headers,
          ...(attempt > 0 ? { 'x-gateway-retry-attempt': String(attempt) } : {}),
        },
      });

      if (!canRetry || attempt >= PROXY_RETRY_ATTEMPTS || !shouldRetryProxyResponse(response)) {
        return response;
      }
    } catch (error) {
      if (
        error?.code === 'ERR_CANCELED' ||
        !canRetry ||
        attempt >= PROXY_RETRY_ATTEMPTS ||
        !shouldRetryProxyError(error)
      ) {
        throw error;
      }
    }

    await delay(retryDelay(attempt));
    attempt += 1;
  }
}

function buildProxy(targetOrResolver, sourcePrefix, targetPrefix = '/api/v1') {
  return async function proxyRoutes(fastify) {
    const isDynamicTarget = typeof targetOrResolver === 'function';

    if (!isDynamicTarget && !targetOrResolver) {
      for (const url of ['/', '/*']) {
        fastify.route({
          method: ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
          url,
          handler() {
            throw AppError.serviceUnavailable(
              `Downstream target is not configured for ${sourcePrefix || targetPrefix}.`
            );
          },
        });
      }
      return;
    }

    const getProxyClient = createProxyClientCache();

    for (const url of ['/', '/*']) {
      fastify.route({
        method: ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
        url,
        handler: proxyHandler,
      });
    }

    async function proxyHandler(request, reply) {
      const resolved = normalizeProxyTarget(
        isDynamicTarget ? await targetOrResolver(request) : targetOrResolver,
        sourcePrefix,
        targetPrefix
      );

      if (!resolved.target) {
        throw AppError.serviceUnavailable(
          `Downstream target is not configured for ${resolved.sourcePrefix || resolved.targetPrefix}.`
        );
      }

      const targetPath = buildTargetPath(request, resolved.sourcePrefix, resolved.targetPrefix);
      const breaker = createCircuitBreaker(
        `proxy:${resolved.target}:${request.method}:${normalizeBreakerPath(targetPath)}`
      );

      if (!breaker.canRequest()) {
        throw AppError.serviceUnavailable('Downstream service is temporarily unavailable.');
      }

      try {
        const client = getProxyClient(resolved.target);
        const response = await requestWithRetry(client, {
          method: request.method,
          url: targetPath,
          headers: buildHeaders(request),
          data: serializeBody(request),
          signal: request.abortController?.signal,
        }, request);
        const body = parseProxyBody(response);

        if (TRANSIENT_STATUS_CODES.has(Number(response.status)) || response.status >= 500) {
          breaker.recordFailure({ statusCode: response.status });
        } else {
          breaker.recordSuccess();
        }

        copyResponseHeaders(response, reply);

        if (response.status >= 400) {
          return sendProxyError(reply, response.status, body);
        }

        if (body && typeof body === 'object' && body.success !== undefined) {
          return reply.code(response.status).send(body);
        }

        return reply.code(response.status).json(body ?? null);
      } catch (error) {
        if (error?.code !== 'ERR_CANCELED') {
          breaker.recordFailure(error);
        }
        request.log.error({
          event: 'proxy_error',
          target: resolved.target,
          method: request.method,
          originalUrl: request.originalUrl,
          targetPath,
          code: error.code,
          error: error.message,
        });

        if (error?.code === 'ERR_CANCELED') {
          throw AppError.timeout('Request was cancelled before the downstream service responded.');
        }

        throw AppError.downstream('Downstream service is temporarily unavailable.');
      }
    }
  };
}

module.exports = { buildProxy };
