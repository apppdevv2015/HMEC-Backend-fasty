const alertController = require('./alert.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

async function alertRoutes(fastify, options) {
    
    fastify.get('/', {
        schema: {
            description: 'Get live alerts filtered by company and machine access — company-wide roles see all, operators/artisans see only assigned machines',
            tags: ['Live Alerts'],
            summary: 'List Alerts'
        },
        preHandler: authMiddleware
    }, alertController.getAlerts);

  
    fastify.get('/:id', {
        schema: {
            description: 'Get full detail of a single alert by ID',
            tags: ['Live Alerts'],
            summary: 'Get Alert by ID',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Alert ID' }
                },
                required: ['id']
            }
        },
        preHandler: authMiddleware
    }, alertController.getAlertById);

   
    fastify.delete('/:id', {
        schema: {
            description: 'Delete an alert record',
            tags: ['Live Alerts'],
            summary: 'Delete Alert',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Alert ID' }
                },
                required: ['id']
            }
        },
        preHandler: authMiddleware
    }, alertController.deleteAlert);
}

module.exports = alertRoutes;