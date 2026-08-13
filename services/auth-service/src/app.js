const Fastify = require('fastify');
const querystring = require('querystring');
const fastifySensible = require('@fastify/sensible');
const fastifyCors = require('@fastify/cors');

// Middleware & Config Imports
const errorHandler = require('./middlewares/errorHandler');
const setupSwagger = require('./config/swagger');

// Route Imports
const authRoutes = require('./modules/auth/routes/auth.routes');
const userRoutes = require('./modules/user/routes/user.routes');
const roleRoutes = require('./modules/role/routes/role.routes');
const notificationRoutes = require('./modules/notification/routes/notification.routes');
const subscriptionRoutes = require('./modules/subscription/routes/subscription.routes');
const ticketRoutes = require('./modules/ticket/routes/ticket.routes');

function buildApp(opts = {}) {
    // 1. Initialize Fastify Instance with built-in Logger
    const fastify = Fastify(opts);

    // Register Form-Urlencoded Content Type Parser
    fastify.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (req, body, done) => {
        try {
            done(null, querystring.parse(body));
        } catch (err) {
            done(err);
        }
    });

    // 2. Register Sensible utilities & CORS support
    fastify.register(fastifySensible);
    fastify.register(fastifyCors, {
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

    // 6. Register Fastify Route Plugins
    fastify.register(authRoutes);
    fastify.register(userRoutes);
    fastify.register(roleRoutes, { prefix: '/roles' });
    fastify.register(notificationRoutes, { prefix: '/notifications' });

    // Plans & PayFast (Mount at multiple prefixes for gateway rewrites compatibility)
    fastify.register(subscriptionRoutes, { prefix: '/api/plans' });
    fastify.register(subscriptionRoutes, { prefix: '/plans' });
    fastify.register(subscriptionRoutes, { prefix: '/subscriptions' });

    // Tickets
    fastify.register(ticketRoutes, { prefix: '/tickets' });
    fastify.register(ticketRoutes, { prefix: '/api/tickets' });

    // 7. Register Global Error Handler
    fastify.setErrorHandler(errorHandler);

    return fastify;
}

module.exports = buildApp;


