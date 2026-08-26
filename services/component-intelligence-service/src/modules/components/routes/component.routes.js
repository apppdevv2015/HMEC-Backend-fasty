const componentController = require('../controllers/component.controller');
const intelligenceController = require('../../intelligence/controllers/intelligence.controller');
const { componentValidation, inspectValidation } = require('../../../validations/component.validation');
const { authMiddleware, isAdmin } = require('../../../middlewares/auth.middleware');

async function componentRoutes(fastify, options) {
    // Get all components for a machine or company
    fastify.get('/', { preHandler: authMiddleware }, componentController.getComponents);

    // Safe categories endpoint to avoid 404s
    fastify.get('/categories', async (request, reply) => {
        return reply.send({ success: true, data: [] });
    });

    // Get all components for a specific machine by machine ID
    fastify.get('/machine/:machineId', { preHandler: authMiddleware }, componentController.getComponentsByMachineId);

    // Register a new component - Authorized Users (Admins, Supervisors, Artisans, Operators)
    fastify.post('/', { 
        preHandler: [authMiddleware, componentValidation] 
    }, componentController.addComponent);

    // Update a component - Authorized Users
    fastify.put('/:id', { 
        preHandler: [authMiddleware, componentValidation] 
    }, componentController.updateComponent);

    // Update component operational metrics (Engineers/Inspectors/Operators) - Tenant Restricted
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

