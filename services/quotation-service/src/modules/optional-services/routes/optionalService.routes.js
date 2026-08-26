const optionalServiceController = require('../controllers/optionalService.controller');
const { authMiddleware, optionalAuthMiddleware } = require('../../../middlewares/auth.middleware');
const { requireSuperAdmin } = require('../../../middlewares/rbac.middleware');

async function optionalServiceRoutes(fastify, options) {
    // Public / Company User routes to get available active services
    fastify.get('/', { preHandler: optionalAuthMiddleware }, optionalServiceController.getPublicServices);
    fastify.get('/:id', { preHandler: optionalAuthMiddleware }, optionalServiceController.getServiceById);

    // Super Admin CRUD endpoints
    fastify.get('/admin/all', { preHandler: [authMiddleware, requireSuperAdmin] }, optionalServiceController.getAdminServices);
    fastify.get('/admin', { preHandler: [authMiddleware, requireSuperAdmin] }, optionalServiceController.getAdminServices);
    fastify.post('/', { preHandler: [authMiddleware, requireSuperAdmin] }, optionalServiceController.createService);
    fastify.post('/admin/all', { preHandler: [authMiddleware, requireSuperAdmin] }, optionalServiceController.createService);
    fastify.post('/admin', { preHandler: [authMiddleware, requireSuperAdmin] }, optionalServiceController.createService);
    fastify.put('/:id', { preHandler: [authMiddleware, requireSuperAdmin] }, optionalServiceController.updateService);
    fastify.patch('/:id/toggle', { preHandler: [authMiddleware, requireSuperAdmin] }, optionalServiceController.toggleStatus);
    fastify.delete('/:id', { preHandler: [authMiddleware, requireSuperAdmin] }, optionalServiceController.deleteService);
}

module.exports = optionalServiceRoutes;
