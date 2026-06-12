const jwt = require('jsonwebtoken');

function authPlugin(fastify, options, done) {
  done();
}

const INTERNAL_CONTEXT_HEADERS = [
  'x-request-id',
  'x-correlation-id',
  'x-user-id',
  'x-user-role',
  'x-service-name',
  'x-internal-token',
  'x-internal-service-token'
];

function stripInternalAuthHeaders(headers = {}) {
  const result = { ...headers };
  for (const header of INTERNAL_CONTEXT_HEADERS) {
    delete result[header];
    delete result[header.toLowerCase()];
  }
  return result;
}

function buildTrustedUserHeaders(userContext = {}) {
  return {
    'x-user-id': userContext.id || userContext.userId || '',
    'x-user-role': userContext.role || userContext.userRole || '',
  };
}

function verifyInternalRequest(options = {}) {
  return (req, res, next) => {
    const internalServiceToken = process.env.INTERNAL_SERVICE_TOKEN;
    const token = req.headers['x-internal-token'] || req.headers['x-internal-service-token'];
    
    if (!internalServiceToken) {
      return next();
    }
    
    if (token === internalServiceToken) {
      return next();
    }
    
    const AppError = require('../errors/AppError').AppError || require('../errors/AppError');
    return next(AppError.unauthorized('Internal request authentication failed.'));
  };
}

function authenticateJwt(options = {}) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      const AppError = require('../errors/AppError').AppError || require('../errors/AppError');
      return next(AppError.unauthorized('Authentication is required.'));
    }

    const token = authHeader.split(' ')[1];
    try {
      const secret = process.env.JWT_SECRET || 'hme-secret-key-2026';
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      next();
    } catch (err) {
      const AppError = require('../errors/AppError').AppError || require('../errors/AppError');
      return next(AppError.unauthorized('Invalid or expired token.'));
    }
  };
}

function authorize() {
  return (req, res, next) => next();
}

function authorizeRoles(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      const AppError = require('../errors/AppError').AppError || require('../errors/AppError');
      return next(AppError.forbidden('You do not have access to this resource.'));
    }
    next();
  };
}

function buildAccessTokenPayload(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

function buildUserContext(req) {
  return req.user || {};
}

function createRefreshToken() {
  return require('crypto').randomBytes(40).toString('hex');
}

function hashRefreshToken(token) {
  return require('crypto').createHash('sha256').update(token).digest('hex');
}

function getInternalRequestContext() {
  return {};
}

function resolveJwtConfig() {
  return {
    secret: process.env.JWT_SECRET || 'hme-secret-key-2026',
    expiresIn: process.env.JWT_ACCESS_TOKEN_TTL || '15m',
  };
}

function signAccessToken(payload, secret, options = {}) {
  return jwt.sign(payload, secret || process.env.JWT_SECRET || 'hme-secret-key-2026', options);
}

function verifyJwtToken(token, secret) {
  return jwt.verify(token, secret || process.env.JWT_SECRET || 'hme-secret-key-2026');
}

Object.assign(authPlugin, {
  authenticateJwt,
  authorize,
  authorizeRoles,
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
  verifyInternalRequest,
  verifyJwtToken,
});

module.exports = authPlugin;
