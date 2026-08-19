const machineController = require('../controllers/machine.controller');
const manualInspectionController = require('../controllers/manualInspection.controller');
const machineValidation = require('../../../validations/machine.validation');
const { authMiddleware, isAdmin, canAssignMachine } = require('../../../middlewares/auth.middleware');

async function machineRoutes(fastify, options) {
    fastify.get('/categories', { preHandler: authMiddleware }, machineController.getCategories);
    fastify.post('/categories', { preHandler: [authMiddleware, isAdmin] }, machineController.createCategory);
    fastify.put('/categories/:id', { preHandler: [authMiddleware, isAdmin] }, machineController.updateCategory);
    fastify.delete('/categories/:id', { preHandler: [authMiddleware, isAdmin] }, machineController.deleteCategory);

    // Get ALL assigned machines for company (optional ?operatorId=... filter)
    fastify.get('/assignments', { 
        preHandler: authMiddleware 
    }, machineController.getAllAssignedMachines);

    // Get operator specific assigned machines and full assignment history
    fastify.get('/operator-assignments', { 
        preHandler: authMiddleware 
    }, machineController.getOperatorAssignmentsHistory);

    fastify.get('/operator/:operatorId/assignments', { 
        preHandler: authMiddleware 
    }, machineController.getOperatorAssignmentsHistory);

    fastify.post('/', { 
        preHandler: [authMiddleware, isAdmin, machineValidation] 
    }, machineController.addMachine);
    
    fastify.get('/', { 
        preHandler: authMiddleware 
    }, machineController.getMachines);

    fastify.get('/:id', { 
        preHandler: authMiddleware 
    }, machineController.getMachineById);

    // Get all components for a specific machine by machine ID
    fastify.get('/:id/components', { 
        preHandler: authMiddleware 
    }, machineController.getMachineComponents);

    // Get single machine assignment by machine ID
    fastify.get('/:id/assign', { 
        preHandler: authMiddleware 
    }, machineController.getMachineAssignment);

    // Assign machine by machine ID (Protected with canAssignMachine middleware)
    fastify.post('/:id/assign', { 
        preHandler: [authMiddleware, canAssignMachine] 
    }, machineController.assignMachine);

    // Manual Data Entry & Inspection Routes (Company Admin Only for submission)
    fastify.post('/:id/manual-data', { 
        preHandler: [authMiddleware, isAdmin] 
    }, manualInspectionController.submitManualData);

    fastify.get('/:id/manual-data', { 
        preHandler: authMiddleware 
    }, manualInspectionController.getManualData);
    
    fastify.put('/:id', { 
        preHandler: [authMiddleware, isAdmin, machineValidation] 
    }, machineController.updateMachine);

    fastify.delete('/:id', { 
        preHandler: [authMiddleware, isAdmin] 
    }, machineController.deleteMachine);
}

module.exports = machineRoutes;
