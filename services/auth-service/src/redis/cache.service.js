const { redisClient } = require('./redis.client');

async function get(key) {
  try {
    if (redisClient.isReady) {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : null;
    }
  } catch (e) {
    console.error('Cache get error:', e);
  }
  return null;
}

async function set(key, value, ttlSeconds = 300) {
  try {
    if (redisClient.isReady) {
      await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
      return true;
    }
  } catch (e) {
    console.error('Cache set error:', e);
  }
  return false;
}

async function del(key) {
  try {
    if (redisClient.isReady) {
      await redisClient.del(key);
      return true;
    }
  } catch (e) {
    console.error('Cache del error:', e);
  }
  return false;
}

async function getCompaniesCacheVersion() {
  try {
    if (redisClient.isReady) {
      const version = await redisClient.get('companies:version');
      return version || '1';
    }
  } catch (e) {
    console.error('Cache getCompaniesCacheVersion error:', e);
  }
  return '1';
}

async function bumpCompaniesCacheVersion() {
  try {
    if (redisClient.isReady) {
      await redisClient.incr('companies:version');
    }
  } catch (e) {
    console.error('Cache bumpCompaniesCacheVersion error:', e);
  }
}

async function getUsersCacheVersion() {
  try {
    if (redisClient.isReady) {
      const version = await redisClient.get('users:version');
      return version || '1';
    }
  } catch (e) {
    console.error('Cache getUsersCacheVersion error:', e);
  }
  return '1';
}

async function bumpUsersCacheVersion() {
  try {
    if (redisClient.isReady) {
      await redisClient.incr('users:version');
    }
  } catch (e) {
    console.error('Cache bumpUsersCacheVersion error:', e);
  }
}

module.exports = {
  get,
  set,
  del,
  getCompaniesCacheVersion,
  bumpCompaniesCacheVersion,
  getUsersCacheVersion,
  bumpUsersCacheVersion,
};
