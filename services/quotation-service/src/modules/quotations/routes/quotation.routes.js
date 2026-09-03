const quotationController = require('../controllers/quotation.controller');
const { authMiddleware, optionalAuthMiddleware } = require('../../../middlewares/auth.middleware');
const { requireSuperAdmin, requireCompanyAdmin } = require('../../../middlewares/rbac.middleware');

async function quotationRoutes(fastify, options) {
    // 1. Client Quotation Requests / Inquiries (Submit, List, Manage)
    fastify.post('/requests', { preHandler: optionalAuthMiddleware }, quotationController.createQuotationRequest);
    fastify.post('/inquiry', { preHandler: optionalAuthMiddleware }, quotationController.createQuotationRequest);
    fastify.post('/inquiries', { preHandler: optionalAuthMiddleware }, quotationController.createQuotationRequest);

    fastify.get('/requests', { preHandler: authMiddleware }, quotationController.getQuotationRequests);
    fastify.get('/inquiries', { preHandler: authMiddleware }, quotationController.getQuotationRequests);

    fastify.get('/requests/:id', { preHandler: authMiddleware }, quotationController.getQuotationRequestById);
    fastify.get('/inquiries/:id', { preHandler: authMiddleware }, quotationController.getQuotationRequestById);

    fastify.put('/requests/:id', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.updateQuotationRequest);
    fastify.put('/inquiries/:id', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.updateQuotationRequest);

    fastify.delete('/requests/:id', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.deleteQuotationRequest);
    fastify.delete('/inquiries/:id', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.deleteQuotationRequest);

    // 2. Formal Generated Quotations (Proposals, Send, Accept, Reject)
    fastify.get('/', { preHandler: authMiddleware }, quotationController.getQuotations);
    fastify.get('/:id', { preHandler: authMiddleware }, quotationController.getQuotationById);

    // Super Admin sends official quote or creates add-on quote
    fastify.post('/send', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.sendQuotation);
    fastify.post('/addon', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.createAddonQuotation);

    // EFT Payment Submission & Admin Verification
    fastify.post('/:id/eft-submit', { preHandler: authMiddleware }, quotationController.submitEftPayment);
    fastify.post('/:id/verify-eft', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.verifyEftPayment);

    // Company Admin accepts / rejects
    fastify.post('/:id/accept', { preHandler: [authMiddleware, requireCompanyAdmin] }, quotationController.acceptQuotation);
    fastify.post('/:id/reject', { preHandler: [authMiddleware, requireCompanyAdmin] }, quotationController.rejectQuotation);
}

module.exports = quotationRoutes;

