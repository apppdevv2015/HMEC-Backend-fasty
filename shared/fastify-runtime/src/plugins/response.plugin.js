function responsePlugin(fastify, options, done) {
  fastify.decorateReply('success', function (data, statusCode = 200) {
    this.status(statusCode).send({ success: true, data });
  });
  fastify.decorateReply('fail', function (error, statusCode = 400) {
    this.status(statusCode).send({ success: false, error });
  });
  done();
}

module.exports = responsePlugin;
