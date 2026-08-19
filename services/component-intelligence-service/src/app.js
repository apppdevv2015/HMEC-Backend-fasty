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

const path = require('path');
const fs = require('fs');
const fastifyStatic = require('@fastify/static');

function buildApp(options = {}) {
    const app = Fastify({
        bodyLimit: 50 * 1024 * 1024, // 50MB limit for Base64 image uploads
        ...options
    });

    // Register CORS
    app.register(cors, {
        origin: '*'
    });

    // Ensure public uploads/machine_images directory exists on startup
    const uploadsDir = path.join(__dirname, '../public/uploads/machine_images');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Serve static uploaded machine image files
    app.register(fastifyStatic, {
        root: uploadsDir,
        prefix: '/uploads/machine_images/',
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

