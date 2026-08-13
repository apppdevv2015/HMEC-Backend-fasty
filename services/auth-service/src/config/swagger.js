const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HME Auth Service API',
            version: '1.0.0',
            description: 'Authentication, User Management, and Ticket Service Documentation',
        },
        servers: [
            { url: 'http://localhost:3002', description: 'Auth Service Local' },
            { url: 'http://localhost:4000/api/auth', description: 'Through Gateway' }
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
        path.join(__dirname, '../**/*.js').replace(/\\/g, '/'),
        path.join(__dirname, '../../swagger/*.js').replace(/\\/g, '/')
    ], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

const setupSwagger = async (fastify) => {
    await fastify.register(require('@fastify/swagger'), {
        mode: 'static',
        specification: {
            document: swaggerDocs
        }
    });

    await fastify.register(require('@fastify/swagger-ui'), {
        routePrefix: '/api-docs'
    });
};

module.exports = setupSwagger;
