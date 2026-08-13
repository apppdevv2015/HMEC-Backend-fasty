function parseBoolean(value, defaultValue = false) {
  if (value === undefined) {
    return defaultValue;
  }

  return String(value).toLowerCase() === 'true';
}

function getAllowedOrigins() {
  return (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isLocalDevelopmentOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(?::\d+)?$/i.test(String(origin || ''));
}

function buildCorsOptions() {
  const allowedOrigins = getAllowedOrigins();
  const isDevelopment = (process.env.NODE_ENV || process.env.APP_ENV || 'development') === 'development';
 
  return {
    origin(origin, callback) {
      if (!origin || isDevelopment) {
        return callback(null, true);
      }
 
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
 
      return callback(new Error('Origin not allowed by CORS policy'));
    },
 
    credentials: true,
 
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
 
    allowedHeaders: [
      'Accept',
      'Content-Type',
      'Authorization',
      'Idempotency-Key',
      'X-Correlation-Id',
      'X-Request-Id',
      'X-Trace-Id',
      'X-Service-Name',
      'X-Internal-Token',
      'X-Internal-Service-Token'
    ],
  };
}

function getSecurityConfig() {
  return {
    authRequired: parseBoolean(process.env.AUTH_REQUIRED, false),
    docsEnabled: parseBoolean(process.env.ENABLE_API_DOCS, true),
    internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || '',
    jwtSecret: process.env.JWT_SECRET || '',
    requestBodyLimit: process.env.REQUEST_BODY_LIMIT || '1mb',
    requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 30000),
    httpCacheEnabled: parseBoolean(process.env.ENABLE_HTTP_CACHE, true),
    getCacheTtlSeconds: Number(process.env.GET_CACHE_TTL_SECONDS || 30),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 10000000),
    aiRateLimitMax: Number(process.env.AI_RATE_LIMIT_MAX || 60),
    corsOptions: buildCorsOptions(),
  };
}

module.exports = {
  getSecurityConfig,
};
