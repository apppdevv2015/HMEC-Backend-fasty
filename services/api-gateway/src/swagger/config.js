const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const GATEWAY_URL = process.env.GATEWAY_URL;

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HME Intelligence Unified API',
            version: '1.0.0',
            description: 'Centralized Documentation for all HME Microservices',
        },
        servers: [
            { url: `${GATEWAY_URL}/api/v1`, description: 'Gateway API (v1)' },
            { url: GATEWAY_URL, description: 'Gateway Root' }
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
        // Auth Service swagger docs (lives in auth-service but accessible via shared Docker image)
        path.join(__dirname, '..', '..', '..', 'auth-service', 'swagger', '*.swagger.js'),
        // Intelligence Service swagger docs
        path.join(__dirname, '..', '..', '..', 'component-intelligence-service', 'swagger', '*.swagger.js'),
    ],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

const setupSwagger = async (fastify) => {
    await fastify.register(require('@fastify/swagger'), {
        openapi: swaggerDocs,
        transform: ({ schema, url }) => {
            // Hide all dynamically scanned proxy and internal routes from this gateway instance.
            // This is because they are already fully documented via swagger-jsdoc from the microservices.
            return {
                schema: {
                    ...schema,
                    hide: true
                },
                url
            };
        }
    });

    await fastify.register(require('@fastify/swagger-ui'), {
        routePrefix: '/api-docs'
    });
};

module.exports = setupSwagger;
