const authController = require('../controllers/auth.controller');
const loginValidation = require('../validators/login.validation');
const registerValidation = require('../validators/register.validation');
const authMiddleware = require('../../../middlewares/auth.middleware');

async function authRoutes(fastify, options) {
    fastify.post('/register', { preHandler: registerValidation }, authController.register);
    fastify.post('/login', { preHandler: loginValidation }, authController.login);
    fastify.post('/forgot-password', authController.forgotPassword);
    fastify.post('/verify-reset-token', authController.verifyResetToken);
    fastify.post('/reset-password', authController.resetPassword);
    fastify.post('/impersonate', { preHandler: authMiddleware }, authController.impersonate);
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

    fastify.get('/company/dashboard/sales-trends', { 
        preHandler: [authMiddleware, roleMiddleware(['admin', 'super_admin'])] 
    }, authController.getSalesTrends);

    fastify.get('/company/dashboard/metrics', { 
        preHandler: [authMiddleware, roleMiddleware(['admin', 'super_admin'])] 
    }, authController.getDashboardMetrics);

    fastify.get('/company/dashboard/plan-distribution', { 
        preHandler: [authMiddleware, roleMiddleware(['admin', 'super_admin'])] 
    }, authController.getDashboardPlanDistribution);

    fastify.get('/company/dashboard/recent-activity', { 
        preHandler: [authMiddleware, roleMiddleware(['admin', 'super_admin'])] 
    }, authController.getDashboardRecentActivity);

    fastify.get('/company/dashboard/machine-status', { 
        preHandler: [authMiddleware, roleMiddleware(['admin', 'super_admin'])] 
    }, authController.getDashboardMachineStatus);

    fastify.get('/company/dashboard/alerts-summary', { 
        preHandler: [authMiddleware, roleMiddleware(['admin', 'super_admin'])] 
    }, authController.getDashboardAlertsSummary);

    fastify.post('/company/dashboard/afternoon-report', { 
        preHandler: [authMiddleware, roleMiddleware(['admin', 'super_admin'])] 
    }, authController.sendAfternoonReport);

    fastify.get('/company/dashboard/roles-activity', { 
        preHandler: [authMiddleware, roleMiddleware(['admin', 'super_admin'])] 
    }, authController.getDashboardRolesActivity);

    fastify.get('/company/dashboard/role-details/:id', { 
        preHandler: [authMiddleware, roleMiddleware(['admin', 'super_admin'])] 
    }, authController.getDashboardRoleDetails);
}

module.exports = authRoutes;
