const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HME Auth Service API',
            version: '1.0.0',
            description: 'Authentication and User Management Service Documentation',
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
        path.join(__dirname, '../**/*.js'),
        path.join(__dirname, '../../swagger/*.js')
    ], 
};

console.log('[SWAGGER] Loading docs from:', path.resolve(__dirname, '../../swagger/*.js'));

const swaggerDocs = swaggerJsdoc(swaggerOptions);

const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};

module.exports = setupSwagger;
