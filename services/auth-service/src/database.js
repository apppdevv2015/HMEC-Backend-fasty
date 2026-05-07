const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: process.env.DATABASE_URL || 'postgres://admin:password@postgres:5432/hme_intelligence',
    pool: { min: 2, max: 10 }
});

console.log('[DB-INIT] Database initialized directly with connection string.');

module.exports = db;
