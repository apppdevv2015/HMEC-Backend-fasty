const { Pool } = require('pg');

const createPool = (connectionString) => {
  const pool = new Pool({
    connectionString: connectionString || process.env.DATABASE_URL,
  });

  pool.on('connect', () => {
    console.log('[DATABASE-CLIENT] Connected to PostgreSQL');
  });

  pool.on('error', (err) => {
    console.error('[DATABASE-CLIENT] Unexpected error on idle client', err);
    process.exit(-1);
  });

  return pool;
};

module.exports = { createPool };
