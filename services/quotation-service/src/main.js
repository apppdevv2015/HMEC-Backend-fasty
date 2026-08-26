require('dotenv').config();
const buildApp = require('./app');
const seedDefaultOptionalServices = require('./utils/seedDefaultServices');

const PORT = process.env.QUOTATION_SERVICE_PORT || process.env.PORT || 3006;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
    const app = buildApp({
        logger: false
    });

    try {
        // Auto-seed default optional services
        await seedDefaultOptionalServices();

        await app.listen({ port: Number(PORT), host: HOST });
        console.log(`🚀 [QUOTATION-SERVICE] Running on http://${HOST}:${PORT}`);
    } catch (err) {
        console.error('❌ [QUOTATION-SERVICE_FATAL]', err);
        process.exit(1);
    }
}

startServer();
