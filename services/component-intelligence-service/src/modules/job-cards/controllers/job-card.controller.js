const jobCardService = require('../services/job-card.service');
const { formatResponse } = require('../../../utils/responseFormatter');
const prisma = require('../../../database/prismaClient');

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { pipeline } = require('stream/promises');

const JOB_IMG_DIR = path.join(__dirname, '../../../../public/uploads/job_cards');
fs.mkdirSync(JOB_IMG_DIR, { recursive: true });
const IMG_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };


async function getActor(req) {
    const u = req.user || {};
    const id = u.id || u.userId || u.sub || null;
    let name = u.name || [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    if (!name && id) {
        try {
            const dbUser = await prisma.user.findUnique({
                where: { id: String(id) },
                select: { firstName: true, lastName: true }
            });
            if (dbUser) name = [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ').trim();
        } catch (e) {
           
        }
    }
    return {
        id,
        name: name || u.email || 'Unknown User',
        role: u.role || '',
        email: u.email || null,
        companyId: u.companyId || null
    };
}

class JobCardController {
    async createJobCard(req, reply) {
        try {
            const actor = await getActor(req);
            if (!actor.companyId) throw new Error('Company context missing in token.');
            const result = await jobCardService.createJobCard(actor.companyId, req.body, actor);
            return reply.status(201).send(formatResponse(true, 'Job Card created successfully', result));
        } catch (error) {
            return fail(reply, error);
        }
    }
        async createFromAlert(req, reply) {
        try {
            const actor = await getActor(req);
            if (!actor.companyId) throw new Error('Company context missing in token.');
            const result = await jobCardService.createFromAlert(req.params.alertId, actor.companyId, actor);
            return reply.status(201).send(formatResponse(true, 'Job Card created from alert', result));
        } catch (error) {
            return fail(reply, error);
        }
    } 

    async getJobCards(req, reply) {
        try {
            const actor = await getActor(req);
            if (!actor.companyId) throw new Error('Company context missing in token.');
            const query = { ...req.query };
            if (String(actor.role).toLowerCase().includes('artisan')) {
                if (!actor.id) throw new Error('User id missing in token.');
                query.technicianId = actor.id;
            }
            const result = await jobCardService.getJobCards(actor.companyId, query);
            return reply.status(200).send(formatResponse(true, 'Job Cards fetched successfully', result));
        } catch (error) {
            return fail(reply, error, 500);
        }
    }

    async getJobCardById(req, reply) {
        try {
            const actor = await getActor(req);
            if (!actor.companyId) throw new Error('Company context missing in token.');
            const result = await jobCardService.getJobCardById(req.params.id, actor.companyId);
            if (String(actor.role).toLowerCase().includes('artisan') && result.assignedTechnicianId !== actor.id) {
                throw accessDenied();
            }
            return reply.status(200).send(formatResponse(true, 'Job Card fetched successfully', result));
        } catch (error) {
            return fail(reply, error, 404);
        }
    }

    async updateJobCard(req, reply) {
        try {
            const actor = await getActor(req);
            if (!actor.companyId) throw new Error('Company context missing in token.');
            const result = await jobCardService.updateJobCard(req.params.id, actor.companyId, req.body, actor);
            return reply.status(200).send(formatResponse(true, 'Job Card updated successfully', result));
        } catch (error) {
            return fail(reply, error);
        }
    }

    async updateStatus(req, reply) {
        try {
            const actor = await getActor(req);
            if (!actor.companyId) throw new Error('Company context missing in token.');
            const result = await jobCardService.updateStatus(req.params.id, actor.companyId, req.body, actor);
            return reply.status(200).send(formatResponse(true, 'Job Card status updated successfully', result));
        } catch (error) {
            return fail(reply, error);
        }
    }

    async logLaborTimer(req, reply) {
        try {
            const actor = await getActor(req);
            if (!actor.companyId) throw new Error('Company context missing in token.');
            const result = await jobCardService.logLaborTimer(
                req.params.id,
                actor.companyId,
                { actionType: req.body?.actionType, notes: req.body?.notes },
                actor
            );
            return reply.status(200).send(formatResponse(true, 'Labor log recorded successfully', result));
        } catch (error) {
            return fail(reply, error);
        }
    }

    async addPart(req, reply) {
        try {
            const actor = await getActor(req);
            if (!actor.companyId) throw new Error('Company context missing in token.');
            const result = await jobCardService.addPart(req.params.id, actor.companyId, req.body, actor);
            return reply.status(201).send(formatResponse(true, 'Part added to Job Card successfully', result));
        } catch (error) {
            return fail(reply, error);
        }
    }

    async addInspectionFinding(req, reply) {
        try {
            const actor = await getActor(req);
            if (!actor.companyId) throw new Error('Company context missing in token.');
            const result = await jobCardService.addInspectionFinding(req.params.id, actor.companyId, req.body, actor);
            return reply.status(201).send(formatResponse(true, 'Inspection finding recorded', result));
        } catch (error) {
            return fail(reply, error);
        }
    }

       async addAttachment(req, reply) {
    try {
        const actor = await getActor(req);
        if (!actor.companyId) throw new Error('Company context missing in token.');

        const file = await req.file({ limits: { fileSize: 10 * 1024 * 1024 } });
        if (!file) throw new Error('No image file uploaded.');

        const ext = IMG_EXT[file.mimetype];
        if (!ext) throw new Error('Only JPG, PNG or WEBP images are allowed.');

        const fileTypeField = file.fields?.fileType?.value || 'PHOTO_BEFORE';

        const savedName = `${crypto.randomUUID()}${ext}`;
        const savedPath = path.join(JOB_IMG_DIR, savedName);
        await pipeline(file.file, fs.createWriteStream(savedPath));

        if (file.file.truncated) {
            fs.unlinkSync(savedPath);
            throw new Error('Image is larger than 10 MB.');
        }

        const result = await jobCardService.addAttachment(req.params.id, actor.companyId, {
            fileName: file.filename,
            fileUrl: `/uploads/job_cards/${savedName}`,
            fileType: fileTypeField,
        }, actor);

        return reply.status(201).send(formatResponse(true, 'Image uploaded and attached successfully', result));
    } catch (error) {
        return fail(reply, error);
    }
}


async deleteAttachment(req, reply) {
    try {
        const actor = await getActor(req);
        if (!actor.companyId) throw new Error('Company context missing in token.');

        const deleted = await jobCardService.deleteAttachment(
            req.params.id,
            actor.companyId,
            req.params.attachmentId,
            actor
        );

        const diskPath = path.join(JOB_IMG_DIR, path.basename(deleted.fileUrl));
        fs.unlink(diskPath, () => {});

        return reply.status(200).send(formatResponse(true, 'Attachment deleted successfully', deleted));
    } catch (error) {
        return fail(reply, error);
    }
}
   

    async getDashboard(req, reply) {
        try {
            const actor = await getActor(req);
            if (!actor.companyId) throw new Error('Company context missing in token.');
            const result = await jobCardService.getDashboard(actor.companyId);
            return reply.status(200).send(formatResponse(true, 'Job Card dashboard fetched successfully', result));
        } catch (error) {
            return fail(reply, error, 500);
        }
    }

        async approveJobCard(req, reply) {
        try {
            const actor = await getActor(req);
            if (!actor.companyId) throw new Error('Company context missing in token.');
            const result = await jobCardService.approveJobCard(req.params.id, actor.companyId, {
                actor,
                notes: req.body?.notes
            });
            return reply.status(200).send(formatResponse(true, 'Job Card approval recorded', result));
        } catch (error) {
            return fail(reply, error);
        }
    }

    async getReliabilityMetrics(req, reply) {
        try {
            const companyId = req.user?.companyId; if (!companyId) throw new Error('Company context missing in token.');
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
                       const actor = await getActor(req);
            const companyId = actor.companyId;
            const auditData = {
                ...req.body,
                userId: actor.id,
                userName: actor.name,
                userRole: actor.role,
                userEmail: actor.email
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
            const companyId = req.user?.companyId; if (!companyId) throw new Error('Company context missing in token.');
            const result = await jobCardService.getAuditLogs(id, companyId);
            return reply.status(200).send(formatResponse(true, 'Audit trail fetched from database', result));
        } catch (error) {
            return reply.status(400).send(formatResponse(false, error.message, null, error.message));
        }
    }

    async getAuditStream(req, reply) {
        try {
            const companyId = req.user?.companyId; if (!companyId) throw new Error('Company context missing in token.');
            const limit = parseInt(req.query.limit, 10) || 50;
            const result = await jobCardService.getAuditStream(companyId, limit);
            return reply.status(200).send(formatResponse(true, 'Live audit stream fetched from database', result));
        } catch (error) {
            return reply.status(500).send(formatResponse(false, error.message, null, error.message));
        }
    }

}

function fail(reply, error, code = 400) {
    return reply.status(error.statusCode || code).send(formatResponse(false, error.message, null, error.message));
}
function accessDenied() {
    const err = new Error('Access denied.');
    err.statusCode = 403;
    return err;
}

module.exports = new JobCardController();

