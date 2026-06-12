const crypto = require('crypto');
const {
  signAccessToken,
  verifyJwtToken,
} = require('../../runtime');
const AppError = require('../errors/AppError');

const REFRESH_TOKEN_JTI_PREFIX = 'refresh:';

function hasAsymmetricJwtConfig() {
  return Boolean(
    process.env.JWT_PRIVATE_KEY ||
    process.env.JWT_PRIVATE_KEY_BASE64 ||
    process.env.JWT_PUBLIC_KEY ||
    process.env.JWT_PUBLIC_KEY_BASE64
  );
}

function resolveJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (hasAsymmetricJwtConfig()) {
    return '';
  }

  if ((process.env.APP_ENV || 'development') === 'development') {
    return 'development-only-hme-secret';
  }

  throw new Error('JWT_SECRET is required outside development.');
}

function resolveAccessTokenTtl() {
  return process.env.JWT_ACCESS_TOKEN_TTL || process.env.JWT_EXPIRES_IN || '15m';
}

function resolveRefreshTokenTtl() {
  return process.env.JWT_REFRESH_TOKEN_TTL || '30d';
}

function parseTtlToSeconds(value, fallbackSeconds) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.floor(value));
  }

  const raw = String(value || '').trim().toLowerCase();

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  const match = raw.match(/^(\d+)\s*([smhd])$/);

  if (!match) {
    return fallbackSeconds;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };

  return amount * multipliers[unit];
}

function resolveJwtOptions() {
  const options = {
    accessTokenTtl: resolveAccessTokenTtl(),
    audience: process.env.JWT_AUDIENCE || 'api',
    issuer: process.env.JWT_ISSUER || 'auth-service',
  };

  if (process.env.JWT_SECRET || !hasAsymmetricJwtConfig()) {
    options.secret = resolveJwtSecret();
  }

  return options;
}

function resolveRefreshJwtOptions() {
  return {
    ...resolveJwtOptions(),
    refreshTokenTtl: resolveRefreshTokenTtl(),
    audience:
      process.env.JWT_REFRESH_AUDIENCE ||
      `${process.env.JWT_AUDIENCE || 'api'}:refresh`,
  };
}

function signAuthToken(payload) {
  return signAccessToken({
    sub: payload.sub || payload.userId || payload.id,
    role: payload.role,
    companyId: payload.companyId || null,
    firstName: payload.firstName || null,
    lastName: payload.lastName || null,
    email: payload.email || null,
    isActive: payload.isActive ?? true,
    jti: payload.jti,
  }, {
    ...resolveJwtOptions(),
    expiresIn: resolveAccessTokenTtl(),
  });
}

function verifyAuthToken(token) {
  return verifyJwtToken(token, resolveJwtOptions());
}

function createRefreshTokenId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${REFRESH_TOKEN_JTI_PREFIX}${crypto.randomUUID()}`;
  }

  return `${REFRESH_TOKEN_JTI_PREFIX}${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2)}`;
}

function signRefreshAuthToken(payload) {
  return signAccessToken({
    sub: payload.sub || payload.userId || payload.id,
    role: payload.role,
    companyId: payload.companyId || null,
    firstName: payload.firstName || null,
    lastName: payload.lastName || null,
    email: payload.email || null,
    isActive: payload.isActive ?? true,
    jti: payload.jti || createRefreshTokenId(),
  }, {
    ...resolveRefreshJwtOptions(),
    expiresIn: resolveRefreshTokenTtl(),
  });
}

function verifyRefreshAuthToken(token) {
  const decoded = verifyJwtToken(token, resolveRefreshJwtOptions());

  if (!String(decoded.jti || '').startsWith(REFRESH_TOKEN_JTI_PREFIX)) {
    throw AppError.invalidToken('Invalid refresh token.');
  }

  return decoded;
}

function resolveAccessTokenExpiresInSeconds() {
  return parseTtlToSeconds(resolveAccessTokenTtl(), 15 * 60);
}

// Fixed function name to match the exports statement
function resolveRefreshTokenExpiresInSeconds() {
  return parseTtlToSeconds(resolveRefreshTokenTtl(), 30 * 24 * 60 * 60);
}

module.exports = {
  signAuthToken,
  signRefreshAuthToken,
  verifyAuthToken,
  verifyRefreshAuthToken,
  createRefreshTokenId,
  resolveJwtSecret,
  resolveAccessTokenTtl,
  resolveAccessTokenExpiresInSeconds,
  resolveRefreshTokenTtl,
  resolveRefreshTokenExpiresInSeconds,
};
