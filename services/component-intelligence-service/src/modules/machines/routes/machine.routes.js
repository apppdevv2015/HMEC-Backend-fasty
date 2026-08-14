const machineController = require('../controllers/machine.controller');
const machineValidation = require('../../../validations/machine.validation');
const { authMiddleware, isAdmin } = require('../../../middlewares/auth.middleware');

async function machineRoutes(fastify, options) {
    fastify.get('/categories', machineController.getCategories);
    fastify.post('/categories', machineController.createCategory);
    fastify.delete('/categories/:id', machineController.deleteCategory);

    fastify.post('/', { 
        preHandler: [authMiddleware, isAdmin, machineValidation] 
    }, machineController.addMachine);
    
    fastify.get('/', { 
        preHandler: authMiddleware 
    }, machineController.getMachines);
    
    fastify.put('/:id', { 
        preHandler: [authMiddleware, isAdmin, machineValidation] 
    }, machineController.updateMachine);
    
    fastify.delete('/:id', { 
        preHandler: [authMiddleware, isAdmin] 
    }, machineController.deleteMachine);
}

module.exports = machineRoutes;

