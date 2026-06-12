const { AsyncLocalStorage } = require('async_hooks');
const crypto = require('crypto');

const contextStorage = new AsyncLocalStorage();

/**
 * Fastify Request Context Middleware / Hook
 * Initializes and binds request-scoped context (requestId, correlationId) to AsyncLocalStorage.
 */
const requestContextMiddleware = (fastify, options, done) => {
  fastify.addHook('onRequest', (request, reply, next) => {
    const requestId = request.headers['x-request-id'] || crypto.randomUUID();
    const correlationId = request.headers['x-correlation-id'] || requestId;

    // Set request correlation headers in response
    reply.header('x-request-id', requestId);
    reply.header('x-correlation-id', correlationId);

    const store = {
      requestId,
      correlationId,
      userId: request.user?.id || null,
      userRole: request.user?.role?.name || request.user?.role || null,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] || null,
      method: request.method,
      url: request.url,
      service: process.env.SERVICE_NAME || 'unknown-service'
    };

    contextStorage.run(store, () => {
      request.contextStore = store;
      next();
    });
  });

  done();
};

const getContext = () => {
  return contextStorage.getStore() || {};
};

module.exports = {
  requestContextMiddleware,
  getContext,
};
