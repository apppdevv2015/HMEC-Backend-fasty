const machineController = require('../controllers/machine.controller');
const machineValidation = require('../../../validations/machine.validation');
const { authMiddleware, isAdmin, canAssignMachine } = require('../../../middlewares/auth.middleware');

async function machineRoutes(fastify, options) {
    fastify.get('/categories', machineController.getCategories);
    fastify.post('/categories', machineController.createCategory);
    fastify.delete('/categories/:id', machineController.deleteCategory);

    // Get ALL assigned machines for company
    fastify.get('/assignments', { 
        preHandler: authMiddleware 
    }, machineController.getAllAssignedMachines);

    fastify.post('/', { 
        preHandler: [authMiddleware, isAdmin, machineValidation] 
    }, machineController.addMachine);
    
    fastify.get('/', { 
        preHandler: authMiddleware 
    }, machineController.getMachines);

    fastify.get('/:id', { 
        preHandler: authMiddleware 
    }, machineController.getMachineById);

    // Get single machine assignment by machine ID
    fastify.get('/:id/assign', { 
        preHandler: authMiddleware 
    }, machineController.getMachineAssignment);

    // Assign machine by machine ID (Protected with canAssignMachine middleware)
    fastify.post('/:id/assign', { 
        preHandler: [authMiddleware, canAssignMachine] 
    }, machineController.assignMachine);
    
    fastify.put('/:id', { 
        preHandler: [authMiddleware, isAdmin, machineValidation] 
    }, machineController.updateMachine);

    fastify.delete('/:id', { 
        preHandler: [authMiddleware, isAdmin] 
    }, machineController.deleteMachine);
}

module.exports = machineRoutes;
