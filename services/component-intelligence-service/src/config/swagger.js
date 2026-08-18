const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HME Component Intelligence Service API',
            version: '1.0.0',
            description: 'Component Lifecycle and Intelligence Service Documentation',
        },
        servers: [
            { url: 'http://localhost:3001', description: 'Intelligence Service Local' },
            { url: 'http://localhost:4000/api/intelligence', description: 'Through Gateway' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: [
        path.resolve(__dirname, '../../swagger/*.js'),
        path.resolve(__dirname, '../modules/**/*.js'),
    ], 
};

const setupSwagger = async (fastify) => {
    const swaggerDocs = swaggerJsdoc(swaggerOptions);
    await fastify.register(require('@fastify/swagger'), {
        openapi: swaggerDocs
    });

    await fastify.register(require('@fastify/swagger-ui'), {
        routePrefix: '/api-docs'
    });
};

module.exports = setupSwagger;

