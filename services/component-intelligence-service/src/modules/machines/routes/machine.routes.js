const machineController = require('../controllers/machine.controller');
const machineValidation = require('../../../validations/machine.validation');
const { authMiddleware, isAdmin } = require('../../../middlewares/auth.middleware');
const toPreHandler = require('../../../utils/toPreHandler');

async function machineRoutes(fastify, options) {
    fastify.post('/', { 
        preHandler: [toPreHandler(authMiddleware), toPreHandler(isAdmin), toPreHandler(machineValidation)] 
    }, machineController.addMachine);
    
    fastify.get('/', { 
        preHandler: toPreHandler(authMiddleware) 
    }, machineController.getMachines);
    
    fastify.put('/:id', { 
        preHandler: [toPreHandler(authMiddleware), toPreHandler(isAdmin), toPreHandler(machineValidation)] 
    }, machineController.updateMachine);
    
    fastify.delete('/:id', { 
        preHandler: [toPreHandler(authMiddleware), toPreHandler(isAdmin)] 
    }, machineController.deleteMachine);
}

module.exports = machineRoutes;

