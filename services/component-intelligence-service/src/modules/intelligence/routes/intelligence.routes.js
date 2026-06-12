const intelligenceController = require('../controllers/intelligence.controller');
const intelligenceValidation = require('../../../validations/intelligence.validation');
const machineController = require('../../machines/controllers/machine.controller');
const machineValidation = require('../../../validations/machine.validation');
const { authMiddleware, isAdmin } = require('../../../middlewares/auth.middleware');
const toPreHandler = require('../../../utils/toPreHandler');

async function intelligenceRoutes(fastify, options) {
    fastify.get('/register', { 
        preHandler: [toPreHandler(authMiddleware), toPreHandler(intelligenceValidation)] 
    }, intelligenceController.getRegister);
    
    fastify.get('/dashboard-stats', { 
        preHandler: [toPreHandler(authMiddleware), toPreHandler(intelligenceValidation)] 
    }, intelligenceController.getDashboardStats);

    fastify.get('/fleet-heatmap', { 
        preHandler: [toPreHandler(authMiddleware), toPreHandler(intelligenceValidation)] 
    }, intelligenceController.getFleetHeatMap);

    // Fleet Heat Map CRUD routes (interacting with Machines)
    fastify.post('/fleet-heatmap', {
        preHandler: [toPreHandler(authMiddleware), toPreHandler(isAdmin), toPreHandler(machineValidation)]
    }, machineController.addMachine);

    fastify.put('/fleet-heatmap/:id', {
        preHandler: [toPreHandler(authMiddleware), toPreHandler(isAdmin), toPreHandler(machineValidation)]
    }, machineController.updateMachine);

    fastify.delete('/fleet-heatmap/:id', {
        preHandler: [toPreHandler(authMiddleware), toPreHandler(isAdmin)]
    }, machineController.deleteMachine);
}

module.exports = intelligenceRoutes;


