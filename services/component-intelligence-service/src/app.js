// Trigger nodemon restart v2 - enhanced operator assignment history with supervisor info
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const setupSwagger = require('./config/swagger');

// Routes
const componentRoutes = require('./modules/components/routes/component.routes');
const machineRoutes = require('./modules/machines/routes/machine.routes');
const maintenanceRoutes = require('./modules/maintenance/routes/maintenance.routes');
const jobCardRoutes = require('./modules/job-cards/routes/job-card.routes');
const intelligenceRoutes = require('./modules/intelligence/routes/intelligence.routes');

function buildApp(options = {}) {
    const app = Fastify(options);

    // Register CORS
    app.register(cors, {
        origin: '*'
    });

    // Request Logger hook
    app.addHook('onRequest', async (request, reply) => {
        console.log(`[INTELLIGENCE-SERVICE] ${request.method} ${request.url}`);
    });

    // Swagger Setup
    setupSwagger(app);

    // Health Check
    app.get('/health', async (request, reply) => {
        return { status: 'UP', service: 'intelligence-service' };
    });

    // Register Routes
    app.register(componentRoutes, { prefix: '/components' });
    app.register(machineRoutes, { prefix: '/machines' });
    app.register(maintenanceRoutes, { prefix: '/maintenance' });
    app.register(jobCardRoutes, { prefix: '/job-cards' });
    app.register(intelligenceRoutes, { prefix: '/' });

    return app;
}

module.exports = buildApp;

