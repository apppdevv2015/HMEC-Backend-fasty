const path = require('path');
const swaggerUi = require('swagger-ui-express');
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

const swaggerDocs = swaggerJsdoc(swaggerOptions);

const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};

module.exports = setupSwagger;
