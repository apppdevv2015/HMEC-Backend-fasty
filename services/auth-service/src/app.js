const Fastify = require('fastify');
const db = require('./database/prisma');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'hme-secret-key-2026';

// Routes Imports
const authRoutes = require('./modules/auth/routes/auth.routes');
const planRoutes = require('./modules/subscription/routes/subscription.routes');
const userRoutes = require('./modules/user/routes/user.routes');
const roleRoutes = require('./modules/role/routes/role.routes');
const notificationRoutes = require('./modules/notification/routes/notification.routes');

// Middleware Imports
const errorHandler = require('./middlewares/errorHandler');
const setupSwagger = require('./config/swagger');

function buildApp(opts = {}) {
    // 1. Initialize Fastify Instance with built-in Logger
    const fastify = Fastify(opts);

    // Register Form-Urlencoded Content Type Parser
    const querystring = require('querystring');
    fastify.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (req, body, done) => {
        try {
            done(null, querystring.parse(body));
        } catch (err) {
            done(err);
        }
    });

    // 2. Register Sensible utilities & CORS support
    fastify.register(require('@fastify/sensible'));
    fastify.register(require('@fastify/cors'), {
        origin: true, // Allow cross-origin requests
        credentials: true
    });

    // 3. Setup Swagger APIs Documentation
    setupSwagger(fastify);

    // 4. Global Request Logger Hook (onRequest)
    fastify.addHook('onRequest', async (request, reply) => {
        console.log(`[AUTH-SERVICE] ${request.method} ${request.url}`);
    });

    // 5. Health Check Route
    fastify.get('/health', async (request, reply) => {
        return { status: 'UP', service: 'auth-service' };
    });

    // 6. Register Fastify Route Plugins (with respective prefixes)
    fastify.register(authRoutes);
    fastify.register(userRoutes);
    fastify.register(roleRoutes, { prefix: '/roles' });
    fastify.register(notificationRoutes, { prefix: '/notifications' });

    // Plans & PayFast (Mount at multiple prefixes for gateway rewrites compatibility)
    fastify.register(planRoutes, { prefix: '/api/plans' });
    fastify.register(planRoutes, { prefix: '/plans' });
    fastify.register(planRoutes, { prefix: '/subscriptions' });

    // 7. Register Global Error Handler
    fastify.setErrorHandler(errorHandler);

    return fastify;
}

module.exports = buildApp;


