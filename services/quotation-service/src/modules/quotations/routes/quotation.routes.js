const quotationController = require('../controllers/quotation.controller');
const { authMiddleware } = require('../../../middlewares/auth.middleware');
const { requireSuperAdmin, requireCompanyAdmin } = require('../../../middlewares/rbac.middleware');

async function quotationRoutes(fastify, options) {
    // List and details
    fastify.get('/', { preHandler: authMiddleware }, quotationController.getQuotations);
    fastify.get('/:id', { preHandler: authMiddleware }, quotationController.getQuotationById);

    // Company Admin requests quote
    fastify.post('/request', { preHandler: [authMiddleware, requireCompanyAdmin] }, quotationController.requestQuotation);

    // Super Admin sends official quote
    fastify.post('/send', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.sendQuotation);

    // Company Admin accepts / rejects
    fastify.post('/:id/accept', { preHandler: [authMiddleware, requireCompanyAdmin] }, quotationController.acceptQuotation);
    fastify.post('/:id/reject', { preHandler: [authMiddleware, requireCompanyAdmin] }, quotationController.rejectQuotation);
}

module.exports = quotationRoutes;
