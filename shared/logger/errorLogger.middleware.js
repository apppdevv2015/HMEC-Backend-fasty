const { logErrorToDB } = require('./dbErrorLogger');
const { getContext } = require('./requestContext.middleware');
const createLogger = require('./logger');

/**
 * Fastify Error Logging Middleware
 * Hooked to route execution errors to log to Winston and write database-level logs.
 */
const errorLoggerMiddleware = (fastify, options, done) => {
  const serviceName = options.serviceName || process.env.SERVICE_NAME || 'fastify-service';
  const logger = createLogger(serviceName);

  fastify.addHook('onError', async (request, reply, error) => {
    const context = getContext();

    // 1. Log to Winston (Console & Local Files)
    logger.error(`[${serviceName}] Request Error on ${request.method} ${request.url} - Error: ${error.message}`, {
      requestId: context.requestId,
      correlationId: context.correlationId,
      stack: error.stack,
      statusCode: reply.statusCode || error.statusCode || 500
    });

    let durationMs = null;
    if (request.startTime) {
      const diff = process.hrtime(request.startTime);
      durationMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
    }

    // 2. Log to PostgreSQL Log Table via Prisma
    await logErrorToDB(error, {
      service: serviceName,
      requestId: context.requestId,
      correlationId: context.correlationId,
      userId: context.userId,
      userRole: context.userRole,
      status: reply.statusCode || error.statusCode || 500,
      method: request.method,
      url: request.url,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      duration: durationMs,
      metadata: {
        query: request.query,
        params: request.params,
        body: request.body
      }
    });
  });

  done();
};

module.exports = errorLoggerMiddleware;
