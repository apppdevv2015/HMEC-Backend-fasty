const { getContext } = require('./requestContext.middleware');
const createLogger = require('./logger');

/**
 * Fastify Request Logging Middleware
 * Intercepts incoming requests and logs method, path, client details, and response timing.
 */
const requestLoggerMiddleware = (fastify, options, done) => {
  const serviceName = options.serviceName || process.env.SERVICE_NAME || 'fastify-service';
  const logger = createLogger(serviceName);

  fastify.addHook('onRequest', async (request, reply) => {
    // Record start time using high-resolution real time
    request.startTime = process.hrtime();

    const url = request.url;
    if (url.includes('/health') || url.includes('/favicon')) {
      return;
    }

    const context = getContext();
    logger.info(`[${serviceName}] Incoming Request: ${request.method} ${request.url}`, {
      requestId: context.requestId,
      correlationId: context.correlationId,
      ip: context.ipAddress,
      userAgent: context.userAgent
    });
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const url = request.url;
    if (url.includes('/health') || url.includes('/favicon')) {
      return;
    }

    let durationMs = null;
    if (request.startTime) {
      const diff = process.hrtime(request.startTime);
      durationMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
    }

    const context = getContext();
    logger.info(`[${serviceName}] Request Completed: ${request.method} ${request.url} - Status ${reply.statusCode} in ${durationMs}ms`, {
      requestId: context.requestId,
      correlationId: context.correlationId,
      statusCode: reply.statusCode,
      duration: durationMs
    });
  });

  done();
};

module.exports = requestLoggerMiddleware;
