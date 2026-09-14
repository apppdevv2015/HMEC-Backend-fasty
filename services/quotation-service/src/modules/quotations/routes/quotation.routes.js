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
    fastify.patch('/requests/:id', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.updateQuotationRequest);
    fastify.patch('/inquiries/:id', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.updateQuotationRequest);

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

      // 3. Contracts (built from ACCEPTED quotations)
    fastify.get('/contracts', { preHandler: authMiddleware }, quotationController.getContracts);
    fastify.get('/contracts/:id', { preHandler: authMiddleware }, quotationController.getContractById);
    fastify.post('/contracts', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.createContract);
    fastify.put('/contracts/:id', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.updateContract);
        fastify.delete('/contracts/:id', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.deleteContract);

    fastify.post('/contracts/:id/accept', { preHandler: [authMiddleware, requireCompanyAdmin] }, quotationController.acceptContract);
    fastify.post('/contracts/:id/reject', { preHandler: [authMiddleware, requireCompanyAdmin] }, quotationController.rejectContract);

    // 4. Invoices (built from a Contract; Super Admin generates & sends)
    fastify.get('/invoices', { preHandler: authMiddleware }, quotationController.getInvoices);
    fastify.get('/invoices/:id', { preHandler: authMiddleware }, quotationController.getInvoiceById);
    fastify.get('/invoices/:id/pdf', { preHandler: authMiddleware }, quotationController.getInvoicePdf);
    fastify.post('/invoices', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.createInvoice);

    // 5. Billing Profile (Super Admin's own business + bank details)
    fastify.get('/billing-profile', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.getBillingProfile);
    fastify.post('/billing-profile', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.upsertBillingProfile);
    fastify.put('/billing-profile', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.upsertBillingProfile);
    fastify.get('/contracts/:id/pdf', { preHandler: authMiddleware }, quotationController.getContractPdf);


    fastify.post('/invoices/:id/payment-proof', { preHandler: authMiddleware }, quotationController.submitInvoicePaymentProof);
    fastify.get('/payment-proofs', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.getPaymentProofs);
    fastify.put('/payment-proofs/:id/verify', { preHandler: [authMiddleware, requireSuperAdmin] }, quotationController.verifyPaymentProof);
}

module.exports = quotationRoutes;

