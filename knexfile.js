module.exports = {
  development: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL || 'postgres://admin:password@localhost:5433/hme_intelligence',
    migrations: {
      directory: './infra/database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './infra/database/seeds'
    }
  },
  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './infra/database/migrations',
      tableName: 'knex_migrations'
    }
  }
};
