const fastify = require('fastify');
const cors = require('@fastify/cors');
const setupSwagger = require('./swagger/config');
const setupProxy = require('./routes/proxy.routes');
const setupWebsocket = require('./routes/websocket.routes');

function buildApp(options = {}) {
    const app = fastify({
        logger: false,
        ...options
    });

    // Register CORS
    app.register(cors, {
        origin: '*', // Adjust this for production security
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    });

    // Register Redis
    app.register(require('@fastify/redis'), {
        url: process.env.REDIS_URL,
        closeClient: true
    });

    // Register WebSocket support
    app.register(require('@fastify/websocket'), {
        options: { maxPayload: 1048576 } // 1MB max payload
    });

    // Request Logger hook
    app.addHook('onRequest', (request, reply, done) => {
        console.log(`[GATEWAY] ${request.method} ${request.url}`);
        done();
    });

    app.addHook('onResponse', (request, reply, done) => {
        console.log(`[GATEWAY] ${request.method} ${request.url} -> ${reply.statusCode}`);
        done();
    });

    // Gateway Root & Health Check
    app.get('/', async (request, reply) => {
        return { status: 'UP', message: 'HME API Gateway is Running', health: '/health' };
    });

    app.get('/health', async (request, reply) => {
        return { status: 'UP', service: 'hme-api-gateway' };
    });

    // Bootstrap Swagger, Proxy, and WebSocket routes
    app.register(async (instance) => {
        await setupSwagger(instance);
        await setupProxy(instance);
        await setupWebsocket(instance);
    });

    return app;
}

module.exports = buildApp;
