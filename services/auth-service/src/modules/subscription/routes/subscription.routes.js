const subscriptionController = require('../controllers/subscription.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const planValidation = require('../validators/plan.validation');

async function subscriptionRoutes(fastify, options) {
    const roleMiddleware = (roles) => async (request, reply) => {
        if (!roles.includes(request.user.role)) {
            reply.status(403).send({ error: 'Access denied' });
        }
    };

    // --- Public Routes ---
    fastify.get('/', subscriptionController.getAllPlans);

    // --- Protected Routes ---
    fastify.get('/active', { preHandler: authMiddleware }, subscriptionController.getActiveSubscription);
    fastify.get('/subscriptions', { preHandler: authMiddleware }, subscriptionController.getCompanySubscriptions);
    fastify.post('/checkout', { preHandler: authMiddleware }, subscriptionController.checkout);
    fastify.post('/webhook', subscriptionController.webhook); 

    // --- Super Admin Routes ---
    fastify.get('/admin/subscriptions', { 
        preHandler: [authMiddleware, roleMiddleware(['super_admin', 'sub_super_admin'])] 
    }, subscriptionController.getAllSubscriptions);
    
    fastify.post('/', { 
        preHandler: [authMiddleware, roleMiddleware(['super_admin']), planValidation] 
    }, subscriptionController.createPlan);
    
    fastify.put('/:id', { 
        preHandler: [authMiddleware, roleMiddleware(['super_admin']), planValidation] 
    }, subscriptionController.updatePlan);
    
    fastify.delete('/:id', { 
        preHandler: [authMiddleware, roleMiddleware(['super_admin'])] 
    }, subscriptionController.deletePlan);
}

module.exports = subscriptionRoutes;
