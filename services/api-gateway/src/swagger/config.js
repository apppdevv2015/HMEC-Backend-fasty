const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HME Intelligence Unified API',
            version: '1.0.0',
            description: 'Centralized Documentation for all HME Microservices',
        },
        servers: [
            { url: 'http://localhost:4000/api/v1', description: 'Production API (v1)' },
            { url: 'http://localhost:4000', description: 'Local Gateway (Legacy/Root)' }
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

const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};

module.exports = setupSwagger;
