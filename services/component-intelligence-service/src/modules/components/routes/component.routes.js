const componentController = require('../controllers/component.controller');
const intelligenceController = require('../../intelligence/controllers/intelligence.controller');
const { componentValidation, inspectValidation } = require('../../../validations/component.validation');
const { authMiddleware, isAdmin } = require('../../../middlewares/auth.middleware');

async function componentRoutes(fastify, options) {
    // Component categories endpoints
    fastify.get('/categories', componentController.getCategories);
    fastify.post('/categories', componentController.createCategory);
    fastify.delete('/categories/:id', componentController.deleteCategory);

    // Get all components for a machine or company
    fastify.get('/', { preHandler: authMiddleware }, componentController.getComponents);

    // Register a new component - Admin Only
    fastify.post('/', { 
        preHandler: [authMiddleware, isAdmin, componentValidation] 
    }, componentController.addComponent);

    // Update a component - Admin Only
    fastify.put('/:id', { 
        preHandler: [authMiddleware, isAdmin, componentValidation] 
    }, componentController.updateComponent);

    // Update component operational metrics (Engineers/Inspectors) - Tenant Restricted
    fastify.put('/:id/inspect', { 
        preHandler: [authMiddleware, inspectValidation] 
    }, componentController.inspectComponent);

    // Delete a component - Admin Only
    fastify.delete('/:id', { 
        preHandler: [authMiddleware, isAdmin] 
    }, componentController.deleteComponent);

    // --- Intelligence Engine Endpoints ---

    // Get full component register (with intelligence metrics)
    fastify.get('/register', { preHandler: authMiddleware }, intelligenceController.getRegister);

    // Get dashboard stats (for analytics cards)
    fastify.get('/dashboard-stats', { preHandler: authMiddleware }, intelligenceController.getDashboardStats);
}

module.exports = componentRoutes;

