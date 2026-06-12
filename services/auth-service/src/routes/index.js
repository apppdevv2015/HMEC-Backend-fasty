const v1Routes = require('./v1.routes');

async function routes(fastify) {
  fastify.register(v1Routes, { prefix: '/api/v1' });
}

module.exports = routes;
