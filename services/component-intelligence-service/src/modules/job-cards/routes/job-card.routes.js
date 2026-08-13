const jobCardController = require('../controllers/job-card.controller');
const { authMiddleware } = require('../../../middlewares/auth.middleware');

async function jobCardRoutes(fastify, options) {
    // 1. Core CRUD & Querying
    fastify.post('/', { preHandler: authMiddleware }, jobCardController.createJobCard);
    fastify.get('/', { preHandler: authMiddleware }, jobCardController.getJobCards);
    fastify.get('/metrics', { preHandler: authMiddleware }, jobCardController.getReliabilityMetrics);
    fastify.get('/:id', { preHandler: authMiddleware }, jobCardController.getJobCardById);
    fastify.put('/:id', { preHandler: authMiddleware }, jobCardController.updateJobCard);
    
    // 2. Lifecycle & Execution
    fastify.patch('/:id/status', { preHandler: authMiddleware }, jobCardController.updateStatus);
    fastify.post('/:id/labor-timer', { preHandler: authMiddleware }, jobCardController.logLaborTimer);
    fastify.post('/:id/parts', { preHandler: authMiddleware }, jobCardController.addPart);
    fastify.post('/:id/findings', { preHandler: authMiddleware }, jobCardController.addInspectionFinding);
    fastify.post('/:id/attachments', { preHandler: authMiddleware }, jobCardController.addAttachment);
    fastify.post('/:id/approve', { preHandler: authMiddleware }, jobCardController.approveJobCard);

    // 3. Real-Time Audit Trail & Voice Notes
    fastify.get('/audit-logs/stream', { preHandler: authMiddleware }, jobCardController.getAuditStream);
    fastify.post('/:id/audit-logs', { preHandler: authMiddleware }, jobCardController.addAuditLog);
    fastify.get('/:id/audit-logs', { preHandler: authMiddleware }, jobCardController.getAuditLogs);
    fastify.post('/:id/voice-notes', { preHandler: authMiddleware }, jobCardController.addVoiceNote);
    fastify.get('/:id/voice-notes', { preHandler: authMiddleware }, jobCardController.getVoiceNotes);
    fastify.delete('/voice-notes/:noteId', { preHandler: authMiddleware }, jobCardController.deleteVoiceNote);
}

module.exports = jobCardRoutes;

