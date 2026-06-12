const componentController = require('../controllers/component.controller');
const intelligenceController = require('../../intelligence/controllers/intelligence.controller');
const { componentValidation, inspectValidation } = require('../../../validations/component.validation');
const { authMiddleware, isAdmin } = require('../../../middlewares/auth.middleware');
const toPreHandler = require('../../../utils/toPreHandler');

async function componentRoutes(fastify, options) {
    // Get all component categories
    fastify.get('/categories', { preHandler: toPreHandler(authMiddleware) }, componentController.getCategories);

    // Get all components for a machine or company
    fastify.get('/', { preHandler: toPreHandler(authMiddleware) }, componentController.getComponents);

    // Register a new component - Admin Only
    fastify.post('/', { 
        preHandler: [toPreHandler(authMiddleware), toPreHandler(isAdmin), toPreHandler(componentValidation)] 
    }, componentController.addComponent);

    // Update a component - Admin Only
    fastify.put('/:id', { 
        preHandler: [toPreHandler(authMiddleware), toPreHandler(isAdmin), toPreHandler(componentValidation)] 
    }, componentController.updateComponent);

    // Update component operational metrics (Engineers/Inspectors) - Tenant Restricted
    fastify.put('/:id/inspect', { 
        preHandler: [toPreHandler(authMiddleware), toPreHandler(inspectValidation)] 
    }, componentController.inspectComponent);

    // Delete a component - Admin Only
    fastify.delete('/:id', { 
        preHandler: [toPreHandler(authMiddleware), toPreHandler(isAdmin)] 
    }, componentController.deleteComponent);

    // --- Intelligence Engine Endpoints ---

    // Get full component register (with intelligence metrics)
    fastify.get('/register', { preHandler: toPreHandler(authMiddleware) }, intelligenceController.getRegister);

    // Get dashboard stats (for analytics cards)
    fastify.get('/dashboard-stats', { preHandler: toPreHandler(authMiddleware) }, intelligenceController.getDashboardStats);
}

module.exports = componentRoutes;

