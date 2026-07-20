const maintenanceController = require('../controllers/maintenance.controller');
const { authMiddleware } = require('../../../middlewares/auth.middleware');

async function maintenanceRoutes(fastify, options) {
    fastify.post('/', { preHandler: authMiddleware }, maintenanceController.addLog);
    fastify.get('/', { preHandler: authMiddleware }, maintenanceController.getLogs);
    fastify.put('/:id', { preHandler: authMiddleware }, maintenanceController.updateLog);
    fastify.delete('/:id', { preHandler: authMiddleware }, maintenanceController.deleteLog);
}

module.exports = maintenanceRoutes;

