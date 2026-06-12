const userController = require('../controllers/user.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const userValidation = require('../validators/user.validation');
const toPreHandler = require('../../../utils/toPreHandler');

async function userRoutes(fastify, options) {
    // Users CRUD
    fastify.get('/users', { preHandler: authMiddleware }, userController.getUsers);
    fastify.get('/users/:id', { preHandler: authMiddleware }, userController.getUser);
    
    fastify.post('/users', { 
        preHandler: [authMiddleware, toPreHandler(userValidation)] 
    }, userController.createUser);
    
    fastify.put('/users/:id', { 
        preHandler: [authMiddleware, toPreHandler(userValidation)] 
    }, userController.updateUser);
    
    fastify.delete('/users/:id', { preHandler: authMiddleware }, userController.deleteUser);

    // Super Admin Management Routes
    fastify.get('/users/super-admin/companies', { preHandler: authMiddleware }, userController.getCompanySummaries);
}

module.exports = userRoutes;
