function createServer() {
  const buildApp = require("../app");
  const app = buildApp({ logger: true });
  const port = Number(process.env.PORT || 3002);
  const host = process.env.HOST || "0.0.0.0";
  const keepAliveTimeoutMs = Number(process.env.KEEP_ALIVE_TIMEOUT_MS || 65000);
  const headersTimeoutMs = Number(
    process.env.HEADERS_TIMEOUT_MS || keepAliveTimeoutMs + 5000
  );
  const requestTimeoutMs = Number(process.env.REQUEST_TIMEOUT_MS || 30000);

  app.server.keepAliveTimeout = keepAliveTimeoutMs;
  app.server.headersTimeout = headersTimeoutMs;
  app.server.requestTimeout = requestTimeoutMs;

  app.listen({ port, host }, (error) => {
    if (error) {
      app.log.error(error, "HME Auth Service startup failed");
      process.exit(1);
    }

    app.log.info(
      `HME Auth Service running on port ${port} [APP_ENV=${process.env.APP_ENV}]`
    );
  });

  return app;
}

module.exports = {
  createServer,
};
