const Fastify = require('fastify');
const querystring = require('querystring');
const fastifySensible = require('@fastify/sensible');
const fastifyCors = require('@fastify/cors');

// Route & Swagger Imports
const setupSwagger = require('./config/swagger');
const optionalServiceRoutes = require('./modules/optional-services/routes/optionalService.routes');
const quotationRoutes = require('./modules/quotations/routes/quotation.routes');

function buildApp(opts = {}) {
    const fastify = Fastify(opts);

    // Form Urlencoded Parser
    fastify.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (req, body, done) => {
        try {
            done(null, querystring.parse(body));
        } catch (err) {
            done(err);
        }
    });

    // Plugins
    fastify.register(fastifySensible);
    fastify.register(fastifyCors, {
        origin: true,
        credentials: true
    });

    // Setup Swagger UI Documentation
    setupSwagger(fastify);

    // Request Logger Hook
    fastify.addHook('onRequest', async (request, reply) => {
        console.log(`[QUOTATION-SERVICE] ${request.method} ${request.url}`);
    });

    // Health Check Route
    fastify.get('/health', async (request, reply) => {
        return { status: 'UP', service: 'quotation-service', timestamp: new Date().toISOString() };
    });

    // Register Modules with multiple mount prefixes for direct or gateway proxy compatibility
    fastify.register(optionalServiceRoutes, { prefix: '/optional-services' });
    fastify.register(optionalServiceRoutes, { prefix: '/api/v1/optional-services' });

    fastify.register(quotationRoutes, { prefix: '/quotations' });
    fastify.register(quotationRoutes, { prefix: '/api/v1/quotations' });

    return fastify;
}

module.exports = buildApp;
