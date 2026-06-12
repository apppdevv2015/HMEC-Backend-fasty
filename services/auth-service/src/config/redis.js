const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';

const redisClient = createClient({
  url: redisUrl,
  socket: {
    connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 5000),
    reconnectStrategy: (retries) => Math.min(1000, retries * 100),
  },
});

let connectionPromise = null;

function formatRedisError(error) {
  return error?.message || error?.code || error?.cause?.message || String(error);
}

redisClient.on('error', (err) => {
  console.error('Auth Service Redis error:', formatRedisError(err));
});

redisClient.on('end', () => {
  connectionPromise = null;
});

async function ensureRedisConnected() {
  if (redisClient.isReady) {
    return redisClient;
  }

  if (redisClient.isOpen) {
    await redisClient.ping();
    return redisClient;
  }

  if (!connectionPromise) {
    connectionPromise = redisClient.connect().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;

  return redisClient;
}

async function disconnectRedis() {
  connectionPromise = null;

  if (!redisClient.isOpen) {
    return;
  }

  try {
    await redisClient.quit();
  } catch (_error) {
    redisClient.disconnect();
  }
}

module.exports = {
  redisClient,
  ensureRedisConnected,
  disconnectRedis,
};
