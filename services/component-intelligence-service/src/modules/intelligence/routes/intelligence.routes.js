const intelligenceController = require('../controllers/intelligence.controller');
const intelligenceValidation = require('../../../validations/intelligence.validation');
const machineController = require('../../machines/controllers/machine.controller');
const machineValidation = require('../../../validations/machine.validation');
const { authMiddleware, isAdmin } = require('../../../middlewares/auth.middleware');

async function intelligenceRoutes(fastify, options) {
    fastify.get('/register', { 
        preHandler: [authMiddleware, intelligenceValidation] 
    }, intelligenceController.getRegister);
    
    fastify.get('/dashboard-stats', { 
        preHandler: [authMiddleware, intelligenceValidation] 
    }, intelligenceController.getDashboardStats);

    fastify.get('/fleet-heatmap', { 
        preHandler: [authMiddleware, intelligenceValidation] 
    }, intelligenceController.getFleetHeatMap);

    fastify.get('/fleet-monitoring', { 
        preHandler: [authMiddleware, intelligenceValidation] 
    }, intelligenceController.getFleetMonitoring);

    // Fleet Heat Map CRUD routes (interacting with Machines)
    fastify.post('/fleet-heatmap', {
        preHandler: [authMiddleware, isAdmin, machineValidation]
    }, machineController.addMachine);

    fastify.put('/fleet-heatmap/:id', {
        preHandler: [authMiddleware, isAdmin, machineValidation]
    }, machineController.updateMachine);

    fastify.delete('/fleet-heatmap/:id', {
        preHandler: [authMiddleware, isAdmin]
    }, machineController.deleteMachine);
}

module.exports = intelligenceRoutes;


