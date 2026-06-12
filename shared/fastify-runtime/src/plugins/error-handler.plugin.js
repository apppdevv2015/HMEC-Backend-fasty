function errorHandlerPlugin(fastify, options, done) {
  fastify.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      success: false,
      error: {
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR',
        details: error.details
      }
    });
  });
  done();
}

module.exports = errorHandlerPlugin;
