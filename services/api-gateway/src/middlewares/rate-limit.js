const { getSecurityConfig } = require('../config/security');
const { ensureRedisConnected } = require('../config/redis');
const { createRateLimitHook } = require('../runtime');

const redisClientProvider = async () => ensureRedisConnected();

function createStandardLimiter() {
  const { rateLimitWindowMs, rateLimitMax } = getSecurityConfig();

  return createRateLimitHook({
    keyPrefix: 'api-gateway:standard',
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
    redisClientProvider,
  });
}

function createAiLimiter() {
  const { rateLimitWindowMs, aiRateLimitMax } = getSecurityConfig();

  return createRateLimitHook({
    keyPrefix: 'api-gateway:ai',
    windowMs: rateLimitWindowMs,
    max: aiRateLimitMax,
    message: 'Too many AI requests. Please try again later.',
    redisClientProvider,
  });
}

module.exports = {
  createAiLimiter,
  createStandardLimiter,
};
