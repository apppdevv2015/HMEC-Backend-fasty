const Fastify = require('fastify');
const cors = require('@fastify/cors');
const setupSwagger = require('./config/swagger');
const multipart = require('@fastify/multipart');


const componentRoutes = require('./modules/components/routes/component.routes');
const machineRoutes = require('./modules/machines/routes/machine.routes');
const maintenanceRoutes = require('./modules/maintenance/routes/maintenance.routes');
const jobCardRoutes = require('./modules/job-cards/routes/job-card.routes');
const intelligenceRoutes = require('./modules/intelligence/routes/intelligence.routes');
const alertRoutes = require('./modules/alert/alert.routes');

const path = require('path');
const fs = require('fs');
const fastifyStatic = require('@fastify/static');

function buildApp(options = {}) {
    const app = Fastify({
        bodyLimit: 50 * 1024 * 1024, // 50MB limit for Base64 image uploads
        ...options
    });

  
    app.register(cors, {
        origin: '*'
    });
    app.register(multipart);

    const uploadsDir = path.join(__dirname, '../public/uploads/machine_images');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

   
    app.register(fastifyStatic, {
        root: uploadsDir,
        prefix: '/uploads/machine_images/',
    });

    const jobImgDir = path.join(__dirname, '../public/uploads/job_cards');
    fs.mkdirSync(jobImgDir, { recursive: true });
    app.register(fastifyStatic, {
        root: jobImgDir,
        prefix: '/uploads/job_cards/',
        decorateReply: false,
    });


    app.addHook('onRequest', async (request, reply) => {
        console.log(`[INTELLIGENCE-SERVICE] ${request.method} ${request.url}`);
    });

    setupSwagger(app);

    app.get('/health', async (request, reply) => {
        return { status: 'UP', service: 'intelligence-service' };
    });

    app.register(componentRoutes, { prefix: '/components' });
    app.register(machineRoutes, { prefix: '/machines' });
    app.register(maintenanceRoutes, { prefix: '/maintenance' });
    app.register(jobCardRoutes, { prefix: '/job-cards' });
    app.register(intelligenceRoutes, { prefix: '/' });
    app.register(alertRoutes, { prefix: '/alerts' });

    return app;
}

module.exports = buildApp;

