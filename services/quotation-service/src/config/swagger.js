const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HME Quotation & Optional Services API',
            version: '1.0.0',
            description: 'API Documentation for Quotations, Optional Services Catalog, Contracts, and Invoicing',
        },
        servers: [
            { url: 'http://localhost:3004', description: 'Quotation Service Direct (Port 3004)' },
            { url: 'http://localhost:8000/api/v1', description: 'Through API Gateway (Port 8000)' }
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
    try {
        const swaggerDocs = swaggerJsdoc(swaggerOptions);
        await fastify.register(require('@fastify/swagger'), {
            openapi: swaggerDocs
        });

        await fastify.register(require('@fastify/swagger-ui'), {
            routePrefix: '/api-docs'
        });
    } catch (err) {
        console.error('Swagger initialization error:', err.message);
    }
};

module.exports = setupSwagger;
