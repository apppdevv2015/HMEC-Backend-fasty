const userController = require('../controllers/user.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const { userValidation, subSuperAdminValidation } = require('../validators/user.validation');

async function userRoutes(fastify, options) {
    // Users CRUD
    fastify.get('/users', { preHandler: authMiddleware }, userController.getUsers);
    fastify.get('/users/:id', { preHandler: authMiddleware }, userController.getUser);
    
    fastify.post('/users', { 
        preHandler: [authMiddleware, userValidation] 
    }, userController.createUser);
    
    fastify.post('/users/sub-super-admin', {
        preHandler: [authMiddleware, subSuperAdminValidation]
    }, userController.createSubSuperAdmin);

    fastify.post('/users/sub-admin', {
        preHandler: [
            authMiddleware,
            async (request, reply) => {
                request.body = request.body || {};
                request.body.role_name = 'sub_admin';
            },
            userValidation
        ]
    }, userController.createSubAdmin);
    
    fastify.put('/users/:id', { 
        preHandler: [authMiddleware, userValidation] 
    }, userController.updateUser);
    
    fastify.delete('/users/:id', { preHandler: authMiddleware }, userController.deleteUser);

    fastify.get('/users/company/:companyId/staff', { preHandler: authMiddleware }, userController.getCompanyStaff);

    // Machine Assignment Notification Emails
    fastify.post('/users/send-assignment-email', { preHandler: authMiddleware }, userController.sendAssignmentEmail);

    // Super Admin Management Routes
    fastify.get('/users/super-admin/companies', { preHandler: authMiddleware }, userController.getCompanySummaries);
}

module.exports = userRoutes;
