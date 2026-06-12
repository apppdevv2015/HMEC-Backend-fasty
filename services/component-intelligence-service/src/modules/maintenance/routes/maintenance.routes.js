const maintenanceController = require('../controllers/maintenance.controller');
const { authMiddleware } = require('../../../middlewares/auth.middleware');
const toPreHandler = require('../../../utils/toPreHandler');

async function maintenanceRoutes(fastify, options) {
    fastify.post('/', { preHandler: toPreHandler(authMiddleware) }, maintenanceController.addLog);
    fastify.get('/', { preHandler: toPreHandler(authMiddleware) }, maintenanceController.getLogs);
    fastify.put('/:id', { preHandler: toPreHandler(authMiddleware) }, maintenanceController.updateLog);
    fastify.delete('/:id', { preHandler: toPreHandler(authMiddleware) }, maintenanceController.deleteLog);
}

module.exports = maintenanceRoutes;

