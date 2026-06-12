function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function registerShutdownHandlers(server) {
  let isShuttingDown = false;

  const shutdown = async (signal) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;

    console.log(`${signal} received. Shutting down gracefully...`);

    const forceExitTimer = setTimeout(() => {
      console.error("Graceful shutdown timed out. Forcing exit.");
      process.exit(1);
    }, Number(process.env.SHUTDOWN_TIMEOUT_MS || 10000));

    forceExitTimer.unref?.();

    try {
      await closeServer(server);

      const prisma = require("../database/prisma");
      
      // Handle optional Redis and read replicas if any
      let disconnectRedis = () => Promise.resolve();
      try {
        disconnectRedis = require("../config/redis").disconnectRedis || disconnectRedis;
      } catch (_) {}

      const disconnectReadPrisma =
        prisma.$read && prisma.$read !== prisma ? prisma.$read.$disconnect() : Promise.resolve();

      await Promise.allSettled([prisma.$disconnect(), disconnectReadPrisma, disconnectRedis?.()]);
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error.message);
      process.exit(1);
    } finally {
      clearTimeout(forceExitTimer);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

module.exports = {
  registerShutdownHandlers,
};
