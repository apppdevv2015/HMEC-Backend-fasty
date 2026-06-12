const authController = require('../controllers/auth.controller');
const loginValidation = require('../validators/login.validation');
const registerValidation = require('../validators/register.validation');
const authMiddleware = require('../../../middlewares/auth.middleware');
const toPreHandler = require('../../../utils/toPreHandler');

async function authRoutes(fastify, options) {
    fastify.post('/register', { preHandler: toPreHandler(registerValidation) }, authController.register);
    fastify.post('/login', { preHandler: toPreHandler(loginValidation) }, authController.login);
    fastify.get('/me', { preHandler: authMiddleware }, authController.getMe);

    // Custom role preHandler hook
    const roleMiddleware = (roles) => async (request, reply) => {
        if (!roles.includes(request.user.role)) {
            reply.status(403).send({ error: 'Access denied' });
        }
    };

    fastify.get('/company/dashboard', { 
        preHandler: [authMiddleware, roleMiddleware(['admin', 'super_admin'])] 
    }, authController.getDashboard);
}

module.exports = authRoutes;
