const prisma = require('../../../database/prismaClient');

class JobCardRepository {
    async generateNextJobCardNumber(companyId) {
        const year = new Date().getFullYear();
        const prefix = `JC-${year}-`;
        
        try {
            const count = await prisma.jobCard.count({
                where: {
                    jobCardNumber: {
                        startsWith: prefix
                    }
                }
            });

            const nextNum = (count + 1).toString().padStart(5, '0');
            return `${prefix}${nextNum}`;
        } catch (err) {
            return `${prefix}${Date.now().toString().slice(-5)}`;
        }
    }

    async createJobCard(data) {
        return await prisma.jobCard.create({
            data: {
                jobCardNumber: data.jobCardNumber,
                companyId: data.companyId,
                machineId: data.machineId,
                componentId: data.componentId || null,
                maintenanceType: data.maintenanceType || 'PREVENTIVE',
                priority: data.priority || 'MEDIUM',
                status: data.status || 'OPEN',
                title: data.title,
                description: data.description || null,
                plannedStartDate: data.plannedStartDate ? new Date(data.plannedStartDate) : null,
                plannedFinishDate: data.plannedFinishDate ? new Date(data.plannedFinishDate) : null,
                assignedTechnicianId: data.assignedTechnicianId || null,
                assignedTechnicianName: data.assignedTechnicianName || null,
                assignedSupervisorId: data.assignedSupervisorId || null,
                assignedSupervisorName: data.assignedSupervisorName || null,
                assignedPlannerId: data.assignedPlannerId || null,
                assignedPlannerName: data.assignedPlannerName || null,
                allocatedLaborHours: data.allocatedLaborHours ? parseFloat(data.allocatedLaborHours) : 0,
                requiredTools: data.requiredTools || null,
                parts: data.parts && data.parts.length > 0 ? {
                    create: data.parts.map(p => ({
                        partName: p.partName,
                        partNumber: p.partNumber || null,
                        quantity: parseInt(p.quantity, 10) || 1,
                        unitCost: p.unitCost ? parseFloat(p.unitCost) : 0,
                        totalCost: (parseInt(p.quantity, 10) || 1) * (parseFloat(p.unitCost) || 0)
                    }))
                } : undefined,
                attachments: data.attachments && data.attachments.length > 0 ? {
                    create: data.attachments.map(a => ({
                        fileType: a.fileType || 'MANUAL',
                        fileName: a.fileName,
                        fileUrl: a.fileUrl,
                        uploadedBy: a.uploadedBy || null
                    }))
                } : undefined
            },
            include: {
                machine: { select: { id: true, name: true, serialNumber: true, model: true, site: true } },
                component: { select: { id: true, category: true, description: true, serialNumber: true } },
                parts: true,
                laborLogs: true,
                findings: true,
                attachments: true
            }
        });
    }

    async findJobCards({ companyId, status, maintenanceType, priority, machineId, componentId, technicianId, search, page = 1, limit = 20 }) {
        const where = {};
        if (companyId) where.companyId = companyId;
        if (status && status !== 'ALL') where.status = status;
        if (maintenanceType && maintenanceType !== 'ALL') where.maintenanceType = maintenanceType;
        if (priority && priority !== 'ALL') where.priority = priority;
        if (machineId) where.machineId = machineId;
        if (componentId) where.componentId = componentId;
        if (technicianId) where.assignedTechnicianId = technicianId;

        if (search) {
            where.OR = [
                { jobCardNumber: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { machine: { name: { contains: search, mode: 'insensitive' } } },
                { machine: { serialNumber: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const take = parseInt(limit, 10);

        const [items, total] = await Promise.all([
            prisma.jobCard.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    machine: { select: { id: true, name: true, serialNumber: true, model: true, site: true } },
                    component: { select: { id: true, category: true, description: true, serialNumber: true } },
                    parts: true,
                    laborLogs: true,
                    findings: true,
                    attachments: true
                }
            }),
            prisma.jobCard.count({ where })
        ]);

        return { items, total, page: parseInt(page, 10), limit: take };
    }

    async findJobCardById(id, companyId = null) {
        const where = { id };
        if (companyId) where.companyId = companyId;

        return await prisma.jobCard.findFirst({
            where,
            include: {
                machine: { select: { id: true, name: true, serialNumber: true, model: true, site: true } },
                component: { select: { id: true, category: true, description: true, serialNumber: true } },
                parts: true,
                laborLogs: { orderBy: { createdAt: 'desc' } },
                findings: { orderBy: { createdAt: 'desc' } },
                attachments: { orderBy: { createdAt: 'desc' } }
            }
        });
    }

    async updateJobCard(id, updateData) {
        return await prisma.jobCard.update({
            where: { id },
            data: updateData,
            include: {
                machine: { select: { id: true, name: true, serialNumber: true, model: true } },
                component: { select: { id: true, category: true, description: true } },
                parts: true,
                laborLogs: true,
                findings: true,
                attachments: true
            }
        });
    }

    async addLaborLog(jobCardId, logData) {
        return await prisma.jobCardLaborLog.create({
            data: {
                jobCardId,
                artisanId: logData.artisanId || null,
                artisanName: logData.artisanName || null,
                startTime: new Date(logData.startTime || Date.now()),
                endTime: logData.endTime ? new Date(logData.endTime) : null,
                durationMinutes: logData.durationMinutes || null,
                actionType: logData.actionType || 'WORK',
                notes: logData.notes || null
            }
        });
    }

    async addPart(jobCardId, partData) {
        const quantity = parseInt(partData.quantity, 10) || 1;
        const unitCost = parseFloat(partData.unitCost) || 0;
        const totalCost = quantity * unitCost;

        return await prisma.jobCardPart.create({
            data: {
                jobCardId,
                partName: partData.partName,
                partNumber: partData.partNumber || null,
                quantity,
                unitCost,
                totalCost,
                isConsumed: partData.isConsumed !== false
            }
        });
    }

    async addInspectionFinding(jobCardId, findingData) {
        return await prisma.jobCardInspectionFinding.create({
            data: {
                jobCardId,
                parameterName: findingData.parameterName,
                measuredValue: String(findingData.measuredValue || ''),
                unit: findingData.unit || null,
                standardSpec: findingData.standardSpec || null,
                status: findingData.status || 'PASS',
                remarks: findingData.remarks || null
            }
        });
    }

    async addAttachment(jobCardId, attachmentData) {
        return await prisma.jobCardAttachment.create({
            data: {
                jobCardId,
                fileType: attachmentData.fileType || 'PHOTO_BEFORE',
                fileName: attachmentData.fileName,
                fileUrl: attachmentData.fileUrl,
                uploadedBy: attachmentData.uploadedBy || null
            }
        });
    }

    // --- AUDIT TRAIL DATABASE METHODS (SAFE GUARDED) ---
    async addAuditLog(jobCardId, auditData) {
        try {
            if (!prisma.jobCardAuditLog) return null;
            return await prisma.jobCardAuditLog.create({
                data: {
                    jobCardId,
                    action: auditData.action,
                    title: auditData.title,
                    description: auditData.description,
                    fieldChanged: auditData.fieldChanged || null,
                    oldValue: auditData.oldValue ? String(auditData.oldValue) : null,
                    newValue: auditData.newValue ? String(auditData.newValue) : null,
                    userId: auditData.userId || null,
                    userName: auditData.userName || 'System User',
                    userRole: auditData.userRole || null,
                    userEmail: auditData.userEmail || null,
                    badgeColor: auditData.badgeColor || null
                }
            });
        } catch (err) {
            console.warn('[AUDIT-LOG-WARN] Audit log creation skipped:', err.message);
            return null;
        }
    }

    async getAuditLogs(jobCardId) {
        try {
            if (!prisma.jobCardAuditLog) return [];
            return await prisma.jobCardAuditLog.findMany({
                where: { jobCardId },
                orderBy: { createdAt: 'desc' }
            });
        } catch (err) {
            return [];
        }
    }

    async getAuditStream(companyId, limit = 50) {
        try {
            if (!prisma.jobCardAuditLog) return [];
            return await prisma.jobCardAuditLog.findMany({
                where: companyId ? { jobCard: { companyId } } : {},
                orderBy: { createdAt: 'desc' },
                take: limit,
                include: {
                    jobCard: {
                        select: {
                            id: true,
                            jobCardNumber: true,
                            title: true,
                            priority: true,
                            status: true
                        }
                    }
                }
            });
        } catch (err) {
            return [];
        }
    }

    // --- VOICE NOTES DATABASE METHODS (SAFE GUARDED) ---
    async addVoiceNote(jobCardId, voiceData) {
        try {
            if (!prisma.jobCardVoiceNote) return null;
            return await prisma.jobCardVoiceNote.create({
                data: {
                    jobCardId,
                    title: voiceData.title || 'Voice Note',
                    audioUrl: voiceData.audioUrl,
                    durationSeconds: parseFloat(voiceData.durationSeconds) || 0,
                    userId: voiceData.userId || null,
                    userName: voiceData.userName || 'Technician',
                    userRole: voiceData.userRole || null
                }
            });
        } catch (err) {
            console.warn('[VOICE-NOTE-WARN] Voice note creation skipped:', err.message);
            return null;
        }
    }

    async getVoiceNotes(jobCardId) {
        try {
            if (!prisma.jobCardVoiceNote) return [];
            return await prisma.jobCardVoiceNote.findMany({
                where: { jobCardId },
                orderBy: { createdAt: 'desc' }
            });
        } catch (err) {
            return [];
        }
    }

    async deleteVoiceNote(id) {
        try {
            if (!prisma.jobCardVoiceNote) return null;
            return await prisma.jobCardVoiceNote.delete({
                where: { id }
            });
        } catch (err) {
            return null;
        }
    }

    async deleteJobCard(id) {
        return await prisma.jobCard.delete({
            where: { id }
        });
    }

    async getStatusSummary(companyId) {
        const where = companyId ? { companyId } : {};
        const now = new Date();

        const [
            total,
            open,
            assigned,
            inProgress,
            waitingParts,
            waitingApproval,
            completed,
            closed,
            cancelled,
            overdue
        ] = await Promise.all([
            prisma.jobCard.count({ where }),
            prisma.jobCard.count({ where: { ...where, status: 'OPEN' } }),
            prisma.jobCard.count({ where: { ...where, status: 'ASSIGNED' } }),
            prisma.jobCard.count({ where: { ...where, status: 'IN_PROGRESS' } }),
            prisma.jobCard.count({ where: { ...where, status: 'WAITING_FOR_PARTS' } }),
            prisma.jobCard.count({ where: { ...where, status: 'WAITING_FOR_APPROVAL' } }),
            prisma.jobCard.count({ where: { ...where, status: 'COMPLETED' } }),
            prisma.jobCard.count({ where: { ...where, status: 'CLOSED' } }),
            prisma.jobCard.count({ where: { ...where, status: 'CANCELLED' } }),
            prisma.jobCard.count({
                where: {
                    ...where,
                    status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_PARTS', 'WAITING_FOR_APPROVAL'] },
                    plannedFinishDate: { lt: now }
                }
            })
        ]);

        return {
            total,
            open,
            assigned,
            inProgress,
            waitingParts,
            waitingApproval,
            completed,
            closed,
            cancelled,
            overdue
        };
    }
}

module.exports = new JobCardRepository();
