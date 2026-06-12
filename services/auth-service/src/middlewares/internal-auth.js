const { getSecurityConfig } = require('../config/security');
const { AppError, verifyInternalRequest } = require('../runtime');

const verifyInternalAccess = verifyInternalRequest();

function requireInternalAccess(req, res, next) {
  const securityConfig = getSecurityConfig();
  // Safe fallback if requireInternalToken is not defined in the security configuration object
  const requireInternalToken = securityConfig.requireInternalToken !== undefined
    ? securityConfig.requireInternalToken
    : (process.env.REQUIRE_INTERNAL_TOKEN === 'true' || !!securityConfig.internalServiceToken);
  const internalServiceToken = securityConfig.internalServiceToken;

  if (!requireInternalToken) {
    return next();
  }

  const referer = req.headers.referer || '';
  const origin = req.headers.origin || '';
  const isDocsRequest =
    process.env.APP_ENV !== 'production' &&
    (referer.includes('/api-docs') || origin.includes('/api-docs'));

  if (isDocsRequest) {
    return next();
  }

  if (String(req.path || req.url || '').startsWith('/health')) {
    return next();
  }

  if (!internalServiceToken) {
    return next(AppError.internal(
      'Internal service protection is enabled but INTERNAL_SERVICE_TOKEN is missing.'
    ));
  }

  return verifyInternalAccess(req, res, next);
}

module.exports = {
  requireInternalAccess,
};
