const jobCardService = require('../services/job-card.service');
const { formatResponse } = require('../../../utils/responseFormatter');

class JobCardController {
    async createJobCard(req, reply) {
        try {
            const companyId = req.user?.companyId || req.body.companyId;
            const result = await jobCardService.createJobCard(companyId, req.body);
            return reply.status(201).send(formatResponse(true, 'Job Card created successfully', result));
        } catch (error) {
            return reply.status(400).send(formatResponse(false, error.message, null, error.message));
        }
    }

    async getJobCards(req, reply) {
        try {
            const companyId = req.user?.companyId || req.query.companyId;
            const result = await jobCardService.getJobCards(companyId, req.query);
            return reply.status(200).send(formatResponse(true, 'Job Cards fetched successfully', result));
        } catch (error) {
            return reply.status(500).send(formatResponse(false, error.message, null, error.message));
        }
    }

    async getJobCardById(req, reply) {
        try {
            const { id } = req.params;
            const companyId = req.user?.companyId || req.query.companyId;
            const result = await jobCardService.getJobCardById(id, companyId);
            return reply.status(200).send(formatResponse(true, 'Job Card fetched successfully', result));
        } catch (error) {
            return reply.status(404).send(formatResponse(false, error.message, null, error.message));
        }
    }

    async updateJobCard(req, reply) {
        try {
            const { id } = req.params;
            const companyId = req.user?.companyId || req.body.companyId;
            const result = await jobCardService.updateJobCard(id, companyId, req.body);
            return reply.status(200).send(formatResponse(true, 'Job Card updated successfully', result));
        } catch (error) {
            return reply.status(400).send(formatResponse(false, error.message, null, error.message));
        }
    }

    async updateStatus(req, reply) {
        try {
            const { id } = req.params;
            const companyId = req.user?.companyId || req.body.companyId;
            const result = await jobCardService.updateStatus(id, companyId, req.body);
            return reply.status(200).send(formatResponse(true, 'Job Card status updated successfully', result));
        } catch (error) {
            return reply.status(400).send(formatResponse(false, error.message, null, error.message));
        }
    }

    async logLaborTimer(req, reply) {
        try {
            const { id } = req.params;
            const companyId = req.user?.companyId || req.body.companyId;
            const artisanId = req.user?.id || req.body.artisanId;
            const artisanName = req.user?.name || req.body.artisanName;

            const result = await jobCardService.logLaborTimer(id, companyId, {
                artisanId,
                artisanName,
                actionType: req.body.actionType,
                notes: req.body.notes
            });
            return reply.status(200).send(formatResponse(true, 'Labor log recorded successfully', result));
        } catch (error) {
            return reply.status(400).send(formatResponse(false, error.message, null, error.message));
        }
    }

    async addPart(req, reply) {
        try {
            const { id } = req.params;
            const companyId = req.user?.companyId || req.body.companyId;
            const result = await jobCardService.addPart(id, companyId, req.body);
            return reply.status(201).send(formatResponse(true, 'Part added to Job Card successfully', result));
        } catch (error) {
            return reply.status(400).send(formatResponse(false, error.message, null, error.message));
        }
    }

    async addInspectionFinding(req, reply) {
        try {
            const { id } = req.params;
            const companyId = req.user?.companyId || req.body.companyId;
            const result = await jobCardService.addInspectionFinding(id, companyId, req.body);
            return reply.status(201).send(formatResponse(true, 'Inspection finding recorded', result));
        } catch (error) {
            return reply.status(400).send(formatResponse(false, error.message, null, error.message));
        }
    }

    async addAttachment(req, reply) {
        try {
            const { id } = req.params;
            const companyId = req.user?.companyId || req.body.companyId;
            const result = await jobCardService.addAttachment(id, companyId, req.body);
            return reply.status(201).send(formatResponse(true, 'Attachment saved successfully', result));
        } catch (error) {
            return reply.status(400).send(formatResponse(false, error.message, null, error.message));
        }
    }

    async approveJobCard(req, reply) {
        try {
            const { id } = req.params;
            const companyId = req.user?.companyId || req.body.companyId;
            const result = await jobCardService.approveJobCard(id, companyId, {
                role: req.user?.role || req.body.role,
                approvedBy: req.user?.name || req.body.approvedBy,
                notes: req.body.notes,
                status: req.body.status
            });
            return reply.status(200).send(formatResponse(true, 'Job Card approval recorded', result));
        } catch (error) {
            return reply.status(400).send(formatResponse(false, error.message, null, error.message));
        }
    }

    async getReliabilityMetrics(req, reply) {
        try {
            const companyId = req.user?.companyId || req.query.companyId;
            const result = await jobCardService.getReliabilityMetrics(companyId);
            return reply.status(200).send(formatResponse(true, 'Reliability KPIs fetched successfully', result));
        } catch (error) {
            return reply.status(500).send(formatResponse(false, error.message, null, error.message));
        }
    }

    // --- AUDIT TRAIL CONTROLLERS ---
    async addAuditLog(req, reply) {
        try {
            const { id } = req.params;
            const companyId = req.user?.companyId || req.body.companyId;
            const auditData = {
                ...req.body,
                userId: req.user?.id || req.body.userId,
                userName: req.user?.name || req.body.userName || 'System User',
                userRole: req.user?.role || req.body.userRole,
                userEmail: req.user?.email || req.body.userEmail
            };
            const result = await jobCardService.addAuditLog(id, companyId, auditData);
            return reply.status(201).send(formatResponse(true, 'Audit log saved to database', result));
        } catch (error) {
            return reply.status(400).send(formatResponse(false, error.message, null, error.message));
        }
    }

    async getAuditLogs(req, reply) {
        try {
            const { id } = req.params;
            const companyId = req.user?.companyId || req.query.companyId;
            const result = await jobCardService.getAuditLogs(id, companyId);
            return reply.status(200).send(formatResponse(true, 'Audit trail fetched from database', result));
        } catch (error) {
            return reply.status(400).send(formatResponse(false, error.message, null, error.message));
        }
    }

    async getAuditStream(req, reply) {
        try {
            const companyId = req.user?.companyId || req.query.companyId;
            const limit = parseInt(req.query.limit, 10) || 50;
            const result = await jobCardService.getAuditStream(companyId, limit);
            return reply.status(200).send(formatResponse(true, 'Live audit stream fetched from database', result));
        } catch (error) {
            return reply.status(500).send(formatResponse(false, error.message, null, error.message));
        }
    }

    // --- VOICE NOTES CONTROLLERS ---
    async addVoiceNote(req, reply) {
        try {
            const { id } = req.params;
            const companyId = req.user?.companyId || req.body.companyId;
            const voiceData = {
                ...req.body,
                userId: req.user?.id || req.body.userId,
                userName: req.user?.name || req.body.userName || 'Field Artisan',
                userRole: req.user?.role || req.body.userRole
            };
            const result = await jobCardService.addVoiceNote(id, companyId, voiceData);
            return reply.status(201).send(formatResponse(true, 'Voice note saved to database', result));
        } catch (error) {
            return reply.status(400).send(formatResponse(false, error.message, null, error.message));
        }
    }

    async getVoiceNotes(req, reply) {
        try {
            const { id } = req.params;
            const companyId = req.user?.companyId || req.query.companyId;
            const result = await jobCardService.getVoiceNotes(id, companyId);
            return reply.status(200).send(formatResponse(true, 'Voice notes fetched from database', result));
        } catch (error) {
            return reply.status(400).send(formatResponse(false, error.message, null, error.message));
        }
    }

    async deleteVoiceNote(req, reply) {
        try {
            const { noteId } = req.params;
            const result = await jobCardService.deleteVoiceNote(noteId);
            return reply.status(200).send(formatResponse(true, 'Voice note deleted from database', result));
        } catch (error) {
            return reply.status(400).send(formatResponse(false, error.message, null, error.message));
        }
    }
}

module.exports = new JobCardController();

