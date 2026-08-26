const quotationController = require('../controllers/quotation.controller');
const { authMiddleware, optionalAuthMiddleware } = require('../../../middlewares/auth.middleware');
const { requireSuperAdmin, requireCompanyAdmin } = require('../../../middlewares/rbac.middleware');

async function quotationRoutes(fastify, options) {
    // 1. Quotation Inquiries (Request a Quotation from form)
    fastify.post('/inquiry', { preHandler: optionalAuthMiddleware }, quotationController.createInquiry);
    fastify.post('/inquiries', { preHandler: optionalAuthMiddleware }, quotationController.createInquiry);
    fastify.get('/inquiries', { preHandler: authMiddleware }, quotationController.getInquiries);
    fastify.get('/inquiries/:id', { preHandler: authMiddleware }, quotationController.getInquiryById);
    fastify.put('/inquiries/:id', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.updateInquiry);
    fastify.delete('/inquiries/:id', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.deleteInquiry);

    // 2. Official Formal Quotations
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

