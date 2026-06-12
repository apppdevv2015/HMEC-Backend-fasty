const crypto = require('crypto');

function requestIdPlugin(fastify, options, done) {
  fastify.addHook('onRequest', (request, reply, next) => {
    const headerName = options.headerName || 'x-request-id';
    const id = request.headers[headerName] || crypto.randomUUID();
    request.requestId = id;
    reply.header(headerName, id);
    next();
  });
  done();
}

module.exports = requestIdPlugin;
