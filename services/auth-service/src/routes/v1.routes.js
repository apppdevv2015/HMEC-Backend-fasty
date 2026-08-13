const { authRoutes } = require('../modules/auth');
const { userRoutes } = require('../modules/user');
const { roleRoutes } = require('../modules/role');
const { subscriptionRoutes } = require('../modules/subscription');
const { notificationRoutes } = require('../modules/notification');
const { ticketRoutes } = require('../modules/ticket');
const { requireInternalAccess } = require('../middlewares/internal-auth');
const { AppError } = require('../runtime');

const HEALTH_CHECK_TIMEOUT_MS = Number(process.env.HEALTH_CHECK_TIMEOUT_MS || 2000);
const EVENT_LOOP_LAG_THRESHOLD_MS = Number(process.env.HEALTH_EVENT_LOOP_LAG_THRESHOLD_MS || 250);

function withTimeout(promise, label) {
  let timer;

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`${label} health check timed out after ${HEALTH_CHECK_TIMEOUT_MS}ms`));
      }, HEALTH_CHECK_TIMEOUT_MS);
      timer.unref?.();
    }),
  ]).finally(() => clearTimeout(timer));
}

async function measureEventLoopLag() {
  const startedAt = process.hrtime.bigint();
  await new Promise((resolve) => setImmediate(resolve));
  return Number(process.hrtime.bigint() - startedAt) / 1e6;
}

async function assertRuntimeHealthy() {
  const eventLoopLagMs = await measureEventLoopLag();

  if (eventLoopLagMs > EVENT_LOOP_LAG_THRESHOLD_MS) {
    throw new Error(`event loop lag ${eventLoopLagMs.toFixed(1)}ms exceeds ${EVENT_LOOP_LAG_THRESHOLD_MS}ms`);
  }

  const memory = process.memoryUsage();

  return {
    eventLoopLagMs: Number(eventLoopLagMs.toFixed(1)),
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rss: memory.rss,
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
    },
  };
}

async function healthRoutes(fastify) {
  fastify.get('/health/live', (_request, reply) => {
    return reply.success({
      message: 'HME Auth service is alive',
      data: {
        service: 'hme-auth-service',
        status: 'alive',
      },
    });
  });

  fastify.get('/health/ready', async (_request, reply) => {
    try {
      const prisma = require('../database/prisma');
      const redisClient = require('../redis/redis.client');

      const runtime = await assertRuntimeHealthy();

      await withTimeout(prisma.$queryRaw`SELECT 1`, 'database');

      if (prisma.$read && prisma.$read !== prisma) {
        await withTimeout(prisma.$read.$queryRaw`SELECT 1`, 'read database');
      }

      const client = await redisClient.ensureRedisConnected();
      await withTimeout(client.ping(), 'redis ping');

      return reply.success({
        message: 'HME Auth service is ready',
        data: {
          service: 'hme-auth-service',
          status: 'ready',
          database: 'up',
          readDatabase: prisma.$read && prisma.$read !== prisma ? 'up' : 'same-as-primary',
          redis: 'up',
          runtime,
        },
      });
    } catch (error) {
      throw AppError.serviceUnavailable('Service dependencies are not ready.', {
        dependencyError: error.message,
      });
    }
  });
}

async function protectedRoutes(fastify) {
  const { requireInternalAccess: internalAuthMiddleware } = requireInternalAccess;
  fastify.addHook('preHandler', internalAuthMiddleware);
  
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(userRoutes, { prefix: '/users' });
  fastify.register(roleRoutes, { prefix: '/roles' });
  fastify.register(notificationRoutes, { prefix: '/notifications' });
  fastify.register(subscriptionRoutes, { prefix: '/plans' });
  fastify.register(subscriptionRoutes, { prefix: '/subscriptions' });
  fastify.register(ticketRoutes, { prefix: '/tickets' });
}

async function v1Routes(fastify) {
  fastify.register(healthRoutes);
  fastify.register(protectedRoutes);
}

module.exports = v1Routes;
