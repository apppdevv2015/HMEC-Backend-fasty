const jobCardController = require('../controllers/job-card.controller');
const { authMiddleware, isAdmin } = require('../../../middlewares/auth.middleware');

async function jobCardRoutes(fastify, options) {
    // 1. Core CRUD & Querying
    fastify.post('/', { preHandler: [authMiddleware, isAdmin] }, jobCardController.createJobCard);
    fastify.get('/', { preHandler: authMiddleware }, jobCardController.getJobCards);
    fastify.get('/metrics', { preHandler: authMiddleware }, jobCardController.getReliabilityMetrics);
    fastify.post('/from-alert/:alertId', { preHandler: [authMiddleware, isAdmin] }, jobCardController.createFromAlert);
    fastify.get('/:id', { preHandler: authMiddleware }, jobCardController.getJobCardById);
    fastify.put('/:id', { preHandler: [authMiddleware, isAdmin] }, jobCardController.updateJobCard);
    fastify.get('/dashboard', { preHandler: authMiddleware }, jobCardController.getDashboard);
    
    // 2. Lifecycle & Execution
    fastify.patch('/:id/status', { preHandler: authMiddleware }, jobCardController.updateStatus);
    fastify.post('/:id/labor-timer', { preHandler: authMiddleware }, jobCardController.logLaborTimer);
    fastify.post('/:id/parts', { preHandler: authMiddleware }, jobCardController.addPart);
    fastify.post('/:id/findings', { preHandler: authMiddleware }, jobCardController.addInspectionFinding);
    fastify.post('/:id/attachments', { preHandler: authMiddleware }, jobCardController.addAttachment);
    fastify.delete('/:id/attachments/:attachmentId', { preHandler: authMiddleware }, jobCardController.deleteAttachment);
    fastify.post('/:id/approve', { preHandler: authMiddleware }, jobCardController.approveJobCard);

    // 3. Real-Time Audit Trail & Voice Notes
    fastify.get('/audit-logs/stream', { preHandler: authMiddleware }, jobCardController.getAuditStream);
    fastify.post('/:id/audit-logs', { preHandler: authMiddleware }, jobCardController.addAuditLog);
    fastify.get('/:id/audit-logs', { preHandler: authMiddleware }, jobCardController.getAuditLogs);
}

module.exports = jobCardRoutes;

