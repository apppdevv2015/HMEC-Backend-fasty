const jobCardRepository = require("../repositories/job-card.repository");
const prisma = require("../../../database/prismaClient");
const {
  notifyUser,
} = require("../../../../../../shared/notifications/notificationPublisher");
const redisModule = require("../../../../../auth-service/src/redis/redis.client");

class JobCardService {
  async createJobCard(companyId, payload) {
    if (!payload.machineId) {
      throw new Error("Machine ID is required to create a Job Card.");
    }
    if (!payload.title) {
      throw new Error("Job Card title or summary is required.");
    }

    const jobCardNumber =
      await jobCardRepository.generateNextJobCardNumber(companyId);

    const jobCard = await jobCardRepository.createJobCard({
      ...payload,
      companyId,
      jobCardNumber,
      status: payload.assignedTechnicianId
        ? "ASSIGNED"
        : payload.status || "OPEN",
    });

    if (jobCard.assignedTechnicianId) {
      await notifyUser(prisma, redisModule, {
        companyId,
        userId: jobCard.assignedTechnicianId,
        title: "New Task Assigned",
        message: `Job Card #${jobCard.jobCardNumber} - "${jobCard.title}" assigned to you`,
        type: "Task",
        severity: "info",
        entityType: "JobCard",
        entityId: jobCard.id,
      });
    }

    return jobCard;
  }

  async getJobCards(companyId, query) {
    const {
      status,
      maintenanceType,
      priority,
      machineId,
      componentId,
      technicianId,
      search,
      page = 1,
      limit = 20,
    } = query;

    const [listData, summary] = await Promise.all([
      jobCardRepository.findJobCards({
        companyId,
        status,
        maintenanceType,
        priority,
        machineId,
        componentId,
        technicianId,
        search,
        page,
        limit,
      }),
      jobCardRepository.getStatusSummary(companyId),
    ]);

    return {
      ...listData,
      summary,
    };
  }

  async getJobCardById(id, companyId) {
    const jobCard = await jobCardRepository.findJobCardById(id, companyId);
    if (!jobCard) {
      throw new Error("Job Card not found.");
    }
    return jobCard;
  }

  async updateJobCard(id, companyId, updateData) {
    const existing = await jobCardRepository.findJobCardById(id, companyId);
    if (!existing) {
      throw new Error("Job Card not found.");
    }

    const dataToUpdate = {};
    const allowedFields = [
      "title",
      "description",
      "maintenanceType",
      "priority",
      "plannedStartDate",
      "plannedFinishDate",
      "assignedTechnicianId",
      "assignedTechnicianName",
      "assignedSupervisorId",
      "assignedSupervisorName",
      "assignedPlannerId",
      "assignedPlannerName",
      "allocatedLaborHours",
      "requiredTools",
      "componentId",
      "rootCause",
      "correctiveAction",
      "postRepairCondition",
      "supervisorNotes",
      "engineeringNotes",
    ];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        if (field.includes("Date") && updateData[field]) {
          dataToUpdate[field] = new Date(updateData[field]);
        } else if (field === "allocatedLaborHours") {
          dataToUpdate[field] = parseFloat(updateData[field]) || 0;
        } else {
          dataToUpdate[field] = updateData[field];
        }
      }
    }

    const updated = await jobCardRepository.updateJobCard(id, dataToUpdate);

    if (
      dataToUpdate.assignedTechnicianId &&
      dataToUpdate.assignedTechnicianId !== existing.assignedTechnicianId
    ) {
      await notifyUser(prisma, redisModule, {
        companyId,
        userId: dataToUpdate.assignedTechnicianId,
        title: "Task Assigned",
        message: `Job Card #${existing.jobCardNumber} assigned to you`,
        type: "Task",
        entityType: "JobCard",
        entityId: id,
      });
    }

    return updated;
  }

  async updateStatus(
    id,
    companyId,
    {
      status,
      reason,
      rootCause,
      correctiveAction,
      postRepairCondition,
      downtimeHours,
    },
  ) {
    const jobCard = await jobCardRepository.findJobCardById(id, companyId);
    if (!jobCard) {
      throw new Error("Job Card not found.");
    }

    const updateData = { status };

    if (status === "IN_PROGRESS" && !jobCard.actualStartDate) {
      updateData.actualStartDate = new Date();
    }

    if (status === "WAITING_FOR_APPROVAL" || status === "COMPLETED") {
      if (!jobCard.actualFinishDate) {
        updateData.actualFinishDate = new Date();
      }
      if (rootCause) updateData.rootCause = rootCause;
      if (correctiveAction) updateData.correctiveAction = correctiveAction;
      if (postRepairCondition)
        updateData.postRepairCondition = postRepairCondition;
      if (downtimeHours !== undefined)
        updateData.downtimeHours = parseFloat(downtimeHours) || 0;
    }

    if (status === "CLOSED") {
      updateData.closedAt = new Date();
    }

    const updated = await jobCardRepository.updateJobCard(id, updateData);

    const notifyTargets = [
      jobCard.assignedTechnicianId,
      jobCard.assignedSupervisorId,
    ].filter(Boolean);
    for (const targetUserId of notifyTargets) {
      await notifyUser(prisma, redisModule, {
        companyId,
        userId: targetUserId,
        title: "Job Card Status Updated",
        message: `Job Card #${jobCard.jobCardNumber} status changed to ${status}`,
        type: "Task",
        entityType: "JobCard",
        entityId: id,
      });
    }

    return updated;
  }

  async logLaborTimer(
    id,
    companyId,
    { artisanId, artisanName, actionType, notes },
  ) {
    const jobCard = await jobCardRepository.findJobCardById(id, companyId);
    if (!jobCard) throw new Error("Job Card not found.");

    const now = new Date();
    let logRecord = null;

    if (actionType === "START" || actionType === "RESUME") {
      logRecord = await jobCardRepository.addLaborLog(id, {
        artisanId,
        artisanName,
        startTime: now,
        actionType: "WORK",
        notes,
      });

      if (jobCard.status !== "IN_PROGRESS") {
        await jobCardRepository.updateJobCard(id, {
          status: "IN_PROGRESS",
          actualStartDate: jobCard.actualStartDate || now,
        });
      }
    } else if (actionType === "PAUSE" || actionType === "FINISH") {
      const openLog = jobCard.laborLogs.find((l) => !l.endTime);
      if (openLog) {
        const startTime = new Date(openLog.startTime);
        const durationMinutes = Math.max(
          1,
          Math.round((now - startTime) / (1000 * 60)),
        );

        await prisma.jobCardLaborLog.update({
          where: { id: openLog.id },
          data: {
            endTime: now,
            durationMinutes,
            notes: notes || openLog.notes,
          },
        });
      }

      const allLogs = await prisma.jobCardLaborLog.findMany({
        where: { jobCardId: id },
      });
      const totalMinutes = allLogs.reduce(
        (sum, log) => sum + (log.durationMinutes || 0),
        0,
      );
      const actualHours = (totalMinutes / 60).toFixed(2);

      await jobCardRepository.updateJobCard(id, {
        actualLaborHours: parseFloat(actualHours),
        status: actionType === "PAUSE" ? "WAITING_FOR_PARTS" : jobCard.status,
      });
    }

    return await this.getJobCardById(id, companyId);
  }

    async addPart(id, companyId, partData) {
    const jobCard = await jobCardRepository.findJobCardById(id, companyId);
    if (!jobCard) throw new Error("Job Card not found.");

    const part = await jobCardRepository.addPart(id, partData);

    const allParts = await prisma.jobCardPart.findMany({
      where: { jobCardId: id },
    });
    const totalCost = allParts.reduce(
      (sum, p) => sum + (parseFloat(p.totalCost) || 0),
      0,
    );

    await jobCardRepository.updateJobCard(id, {
      totalCost: parseFloat(totalCost.toFixed(2)),
    });

    if (jobCard.assignedSupervisorId) {
      await notifyUser(prisma, redisModule, {
        companyId,
        userId: jobCard.assignedSupervisorId,
        title: "Part Added to Job Card",
        message: `Part "${partData.partName}" added to Job Card #${jobCard.jobCardNumber}.`,
        type: "Task",
        entityType: "JobCard",
        entityId: id,
      });
    }

    return part;
  }

   async addInspectionFinding(id, companyId, findingData) {
    const jobCard = await jobCardRepository.findJobCardById(id, companyId);
    if (!jobCard) throw new Error("Job Card not found.");

    const finding = await jobCardRepository.addInspectionFinding(id, findingData);

    if (jobCard.assignedSupervisorId) {
      await notifyUser(prisma, redisModule, {
        companyId,
        userId: jobCard.assignedSupervisorId,
        title: "Inspection Finding Added",
        message: `New finding "${findingData.parameterName}" added to Job Card #${jobCard.jobCardNumber}.`,
        type: "Task",
        entityType: "JobCard",
        entityId: id,
      });
    }

    return finding;
  }

  async addAttachment(id, companyId, attachmentData) {
    const jobCard = await jobCardRepository.findJobCardById(id, companyId);
    if (!jobCard) throw new Error("Job Card not found.");

    const attachment = await jobCardRepository.addAttachment(id, attachmentData);

    if (jobCard.assignedSupervisorId) {
      await notifyUser(prisma, redisModule, {
        companyId,
        userId: jobCard.assignedSupervisorId,
        title: "Attachment Added",
        message: `Attachment "${attachmentData.fileName}" added to Job Card #${jobCard.jobCardNumber}.`,
        type: "Task",
        entityType: "JobCard",
        entityId: id,
      });
    }

    return attachment;
  }

  async approveJobCard(
    id,
    companyId,
    { role, approvedBy, notes, status = "COMPLETED" },
  ) {
    const jobCard = await jobCardRepository.findJobCardById(id, companyId);
    if (!jobCard) throw new Error("Job Card not found.");

    const updateData = {};
    if (role === "supervisor" || role === "SUPERVISOR") {
      updateData.supervisorApprovedAt = new Date();
      updateData.supervisorNotes = notes || "Approved by supervisor";
    } else if (role === "engineer" || role === "ENGINEERING") {
      updateData.engineeringApprovedAt = new Date();
      updateData.engineeringNotes = notes || "Approved by engineering planner";
    }

    if (status) {
      updateData.status = status;
      if (status === "CLOSED") {
        updateData.closedAt = new Date();
      }
    }

    const updated = await jobCardRepository.updateJobCard(id, updateData);

    if (jobCard.assignedTechnicianId) {
      await notifyUser(prisma, redisModule, {
        companyId,
        userId: jobCard.assignedTechnicianId,
        title: "Job Card Approved",
        message: `Job Card #${jobCard.jobCardNumber} approved by ${role}`,
        type: "Task",
        severity: "success",
        entityType: "JobCard",
        entityId: id,
      });
    }

    return updated;
  }

  async getReliabilityMetrics(companyId) {
    const where = companyId ? { companyId } : {};

    const closedJobs = await prisma.jobCard.findMany({
      where: {
        ...where,
        status: { in: ["COMPLETED", "CLOSED"] },
      },
      select: {
        maintenanceType: true,
        actualLaborHours: true,
        downtimeHours: true,
        totalCost: true,
        createdAt: true,
        actualStartDate: true,
        actualFinishDate: true,
        plannedFinishDate: true,
      },
    });

    let totalRepairHours = 0;
    let repairCount = 0;
    for (const job of closedJobs) {
      const labor = parseFloat(job.actualLaborHours) || 0;
      if (labor > 0) {
        totalRepairHours += labor;
        repairCount++;
      }
    }
    const mttrHours =
      repairCount > 0 ? (totalRepairHours / repairCount).toFixed(1) : "0.0";

    const pmJobs = closedJobs.filter((j) => j.maintenanceType === "PREVENTIVE");
    let onTimePm = 0;
    for (const pm of pmJobs) {
      if (pm.actualFinishDate && pm.plannedFinishDate) {
        if (new Date(pm.actualFinishDate) <= new Date(pm.plannedFinishDate)) {
          onTimePm++;
        }
      } else {
        onTimePm++;
      }
    }
    const pmCompliancePercent =
      pmJobs.length > 0 ? Math.round((onTimePm / pmJobs.length) * 100) : 100;

    const breakdownJobs = closedJobs.filter(
      (j) => j.maintenanceType === "BREAKDOWN",
    );
    const totalDowntimeHours = closedJobs.reduce(
      (sum, j) => sum + (parseFloat(j.downtimeHours) || 0),
      0,
    );
    const totalMaintenanceCost = closedJobs.reduce(
      (sum, j) => sum + (parseFloat(j.totalCost) || 0),
      0,
    );

    const mtbfHours =
      breakdownJobs.length > 0 ? Math.round(1200 / breakdownJobs.length) : 720;

    return {
      mttrHours: parseFloat(mttrHours),
      mtbfHours,
      pmCompliancePercent,
      breakdownCount: breakdownJobs.length,
      totalDowntimeHours: parseFloat(totalDowntimeHours.toFixed(1)),
      totalMaintenanceCost: parseFloat(totalMaintenanceCost.toFixed(2)),
    };
  }

  async addAuditLog(id, companyId, auditData) {
    const jobCard = await jobCardRepository.findJobCardById(id, companyId);
    if (!jobCard) throw new Error("Job Card not found.");

    return await jobCardRepository.addAuditLog(id, auditData);
  }

  async getAuditLogs(id, companyId) {
    const jobCard = await jobCardRepository.findJobCardById(id, companyId);
    if (!jobCard) throw new Error("Job Card not found.");

    return await jobCardRepository.getAuditLogs(id);
  }

  async getAuditStream(companyId, limit = 50) {
    return await jobCardRepository.getAuditStream(companyId, limit);
  }

  async addVoiceNote(id, companyId, voiceData) {
    const jobCard = await jobCardRepository.findJobCardById(id, companyId);
    if (!jobCard) throw new Error("Job Card not found.");

    const note = await jobCardRepository.addVoiceNote(id, voiceData);

    await jobCardRepository.addAuditLog(id, {
      action: "AUDIO_NOTE_ADDED",
      title: `Voice Note Recorded: "${voiceData.title || "Field Note"}"`,
      description: `${voiceData.userName || "Artisan"} attached an audio voice diagnostic (${Math.round(voiceData.durationSeconds || 0)}s) to this job card.`,
      newValue: voiceData.title || "Audio Note",
      userId: voiceData.userId,
      userName: voiceData.userName || "Artisan",
      userRole: voiceData.userRole,
      badgeColor:
        "text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
    });

    return note;
  }

  async getVoiceNotes(id, companyId) {
    const jobCard = await jobCardRepository.findJobCardById(id, companyId);
    if (!jobCard) throw new Error("Job Card not found.");

    return await jobCardRepository.getVoiceNotes(id);
  }

  async deleteVoiceNote(noteId) {
    return await jobCardRepository.deleteVoiceNote(noteId);
  }
}

module.exports = new JobCardService();