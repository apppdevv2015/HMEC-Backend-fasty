const quotationPlanController = require('../controllers/quotationPlan.controller');
const { authMiddleware } = require('../../../middlewares/auth.middleware');
const { requireSuperAdmin } = require('../../../middlewares/rbac.middleware');
const {
    idParamSchema,
    createQuotationPlanSchema,
    updateQuotationPlanSchema
} = require('../schemas/quotationPlan.schema');

async function quotationPlanRoutes(fastify, options) {
    // 1. Public catalog of active plans for client dropdowns
    fastify.get('/', {
        schema: {
            description: 'Public catalog of active quotation pricing plans and machine tiers',
            tags: ['Quotation Plans'],
            summary: 'List active quotation plans'
        }
    }, quotationPlanController.getPublicPlans);

    // 2. Super Admin - List all plans (including inactive/drafts)
    fastify.get('/admin', {
        schema: {
            description: 'Super Admin - List all quotation pricing plans (Active + Inactive)',
            tags: ['Quotation Plans'],
            summary: 'Super Admin - List all quotation plans'
        },
        preHandler: [authMiddleware, requireSuperAdmin]
    }, quotationPlanController.getAllPlansForAdmin);

    // 3. Get single plan by ID
    fastify.get('/:id', {
        schema: {
            params: idParamSchema,
            description: 'Get details of a single quotation pricing plan by ID',
            tags: ['Quotation Plans'],
            summary: 'Get single quotation plan'
        }
    }, quotationPlanController.getPlanById);

    // 4. Super Admin - Create new plan
    fastify.post('/', {
        schema: {
            ...createQuotationPlanSchema,
            description: 'Super Admin - Create new quotation pricing tier with machine range & monthly price',
            tags: ['Quotation Plans'],
            summary: 'Super Admin - Create quotation plan'
        },
        preHandler: [authMiddleware, requireSuperAdmin]
    }, quotationPlanController.createPlan);

    // 5. Super Admin - Update plan
    fastify.put('/:id', {
        schema: {
            ...updateQuotationPlanSchema,
            description: 'Super Admin - Update an existing quotation plan',
            tags: ['Quotation Plans'],
            summary: 'Super Admin - Update quotation plan'
        },
        preHandler: [authMiddleware, requireSuperAdmin]
    }, quotationPlanController.updatePlan);

    // 6. Super Admin - Toggle active status
    fastify.patch('/:id/toggle', {
        schema: {
            params: idParamSchema,
            description: 'Super Admin - Toggle active/inactive status of a quotation plan',
            tags: ['Quotation Plans'],
            summary: 'Super Admin - Toggle plan status'
        },
        preHandler: [authMiddleware, requireSuperAdmin]
    }, quotationPlanController.togglePlanActive);

    // 7. Super Admin - Delete plan
    fastify.delete('/:id', {
        schema: {
            params: idParamSchema,
            description: 'Super Admin - Delete a quotation plan',
            tags: ['Quotation Plans'],
            summary: 'Super Admin - Delete quotation plan'
        },
        preHandler: [authMiddleware, requireSuperAdmin]
    }, quotationPlanController.deletePlan);
}

module.exports = quotationPlanRoutes;
