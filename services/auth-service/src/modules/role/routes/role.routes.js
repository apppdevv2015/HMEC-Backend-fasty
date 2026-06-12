const roleController = require('../controllers/role.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const roleValidation = require('../validators/role.validation');
const toPreHandler = require('../../../utils/toPreHandler');

async function roleRoutes(fastify, options) {
    // Helper preHandler hook for role-based access
    const authorize = (roles) => async (request, reply) => {
        console.log(`[AUTH-CHECK] User Role: ${request.user.role} | Required: ${roles}`);
        if (!roles.includes(request.user.role)) {
            console.log(`[AUTH-DENIED] Role ${request.user.role} is not in ${roles}`);
            reply.status(403).send({ error: 'Access denied. Super Admin only.' });
        }
    };

    // Protect all role routes with authentication inside this plugin
    fastify.addHook('preHandler', authMiddleware);

    // Publicly viewable by all authenticated users
    fastify.get('/', roleController.getRoles);
    fastify.get('/:id', roleController.getRole);

    // Restricted to Super Admin only
    fastify.post('/', { 
        preHandler: [authorize(['super_admin']), toPreHandler(roleValidation)] 
    }, roleController.createRole);
    
    fastify.put('/:id', { 
        preHandler: [authorize(['super_admin']), toPreHandler(roleValidation)] 
    }, roleController.updateRole);
    
    fastify.delete('/:id', { 
        preHandler: authorize(['super_admin']) 
    }, roleController.deleteRole);
}

module.exports = roleRoutes;
