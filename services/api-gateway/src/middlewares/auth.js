const { getSecurityConfig } = require('../config/security');
const { AppError, authenticateJwt } = require('../runtime');

const gatewayJwtAuth = authenticateJwt({
  trustInternalUserContext: false,
});

function isPublicGatewayRoute(req) {
  const path = String(req.originalUrl || req.url || '')
    .split('?')[0]
    .replace(/\/+$/, '')
    .toLowerCase();

  const publicPaths = new Set([
    '/health',
    '/api/auth/login',
    '/api/auth/register',
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/health',
    '/api/v1/intelligence/health',
    '/api/v1/fleet/health',
    '/api/v1/ingestion/health',
    '/api/v1/notifications/health'
  ]);

  return publicPaths.has(path) || path.includes('/docs') || path.includes('/openapi.json');
}

async function isTokenBlacklisted(req) {
  const auth = req.auth || req.user || {};
  const jti = auth.jti;

  if (!jti) {
    return false;
  }

  try {
    const { ensureRedisConnected } = require('../config/redis');
    const redis = await ensureRedisConnected();
    return Boolean(
      await redis.get(`token:blacklist:${jti}`) || 
      await redis.get(`user:token:blacklist:${jti}`)
    );
  } catch (error) {
    req.log?.warn?.({
      event: 'token_blacklist_check_failed',
      requestId: req.requestId,
      message: error.message,
    });
    return false;
  }
}

function requireGatewayAuth(req, res, next) {
  const { authRequired } = getSecurityConfig();

  if (!authRequired) {
    return next();
  }

  if (isPublicGatewayRoute(req)) {
    return next();
  }

  return gatewayJwtAuth(req, res, async (error) => {
    if (error) {
      next(error);
      return;
    }

    try {
      if (await isTokenBlacklisted(req)) {
        next(AppError.unauthorized('Token has been revoked.'));
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  });
}

module.exports = {
  requireGatewayAuth,
};
