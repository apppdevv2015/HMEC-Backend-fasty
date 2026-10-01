const jobCardRepository = require("../repositories/job-card.repository");
const prisma = require("../../../database/prismaClient");
const {
  notifyUser,
} = require("../../../../../../shared/notifications/notificationPublisher");
const redisModule = require("../../../../../auth-service/src/redis/redis.client");

function forbidden(message) {
  const err = new Error(message);
  err.statusCode = 403;
  return err;
}

const MAINTENANCE_TYPES = [
  "PREVENTIVE",
  "CORRECTIVE",
  "BREAKDOWN",
  "INSPECTION",
  "REBUILD",
  "COMPONENT_REPLACEMENT",
];
const TYPE_ALIASES = {
  PM: "PREVENTIVE",
  PREVENTIVE_MAINTENANCE: "PREVENTIVE",
  CM: "CORRECTIVE",
  CORRECTIVE_MAINTENANCE: "CORRECTIVE",
  BREAKDOWN_MAINTENANCE: "BREAKDOWN",
  REPLACEMENT: "COMPONENT_REPLACEMENT",
};
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const WORKABLE_STATUSES = [
  "DRAFT",
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_FOR_PARTS",
];
const TECH_STATUSES = [
  "IN_PROGRESS",
  "WAITING_FOR_PARTS",
  "WAITING_FOR_APPROVAL",
];
const ADMIN_ROLE_NAMES = ["admin", "sub_admin", "company_admin"];
const SUPERVISOR_ROLE_NAMES = ["supervisor"];
const STATUS_FLOW = {
  DRAFT: ["OPEN", "ASSIGNED", "CANCELLED"],
  OPEN: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_PARTS", "WAITING_FOR_APPROVAL", "CANCELLED"],
  WAITING_FOR_PARTS: ["IN_PROGRESS", "CANCELLED"],
  WAITING_FOR_APPROVAL: ["IN_PROGRESS", "CANCELLED"],
  COMPLETED: [],
  CLOSED: [],
  CANCELLED: [],
};

function normalizeEnum(v) {
  return String(v || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}
function isManager(actor) {
  const r = String(actor?.role || "").toLowerCase();
  return (
    r.includes("admin") ||
    r.includes("supervisor") ||
    r.includes("manager") ||
    r.includes("engineer")
  );
}
function isAssignedTechnician(jobCard, actor) {
  return !!actor?.id && jobCard.assignedTechnicianId === actor.id;
}
function assertWorkable(jobCard, actor) {
  if (!isManager(actor) && !isAssignedTechnician(jobCard, actor)) {
    throw forbidden(
      "Only the assigned technician or a Supervisor/Admin can do this.",
    );
  }
  if (!WORKABLE_STATUSES.includes(jobCard.status)) {
    throw new Error(
      `Job Card in status ${jobCard.status} can no longer be edited.`,
    );
  }
}
async function audit(jobCardId, actor, action, title, description, extra = {}) {
  return jobCardRepository.addAuditLog(jobCardId, {
    action,
    title,
    description,
    userId: actor?.id,
    userName: actor?.name || "System User",
    userRole: actor?.role,
    userEmail: actor?.email,
    ...extra,
  });
}
async function resolveStaff(companyId, userId, roleKeyword) {
  const u = await prisma.user.findFirst({
    where: {
      id: String(userId),
      companyId,
      isActive: true,
      role: { name: { contains: roleKeyword, mode: "insensitive" } },
    },
    select: { firstName: true, lastName: true },
  });
  if (!u) throw new Error(`Selected ${roleKeyword} not found in this company.`);
  return [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
}

async function notifyJobCardReviewers(companyId, jobCard, actor, notification) {
  const [admins, supervisors] = await Promise.all([
    prisma.user.findMany({
      where: {
        companyId,
        isActive: true,
        role: { name: { in: ADMIN_ROLE_NAMES, mode: "insensitive" } },
      },
      select: { id: true },
    }),
    jobCard.assignedSupervisorId
      ? Promise.resolve([])
      : prisma.user.findMany({
          where: {
            companyId,
            isActive: true,
            role: { name: { in: SUPERVISOR_ROLE_NAMES, mode: "insensitive" } },
          },
          select: { id: true },
        }),
  ]);
  const recipients = new Set([
    jobCard.assignedSupervisorId || null,
    ...supervisors.map((supervisor) => supervisor.id),
    ...admins.map((admin) => admin.id),
  ]);
  recipients.delete(null);
  recipients.delete(undefined);
  recipients.delete(actor?.id);

  for (const userId of recipients) {
    await notifyUser(prisma, redisModule, {
      companyId,
      userId,
      ...notification,
      actorId: actor?.id || null,
      actorName: actor?.name || null,
      actorRole: actor?.role || null,
      entityType: "JobCard",
      entityId: jobCard.id,
    });
  }
}

async function notifyJobCardApprovalRecipient(companyId, jobCard, actor, notification) {
  const actorRole = String(actor?.role || "").toLowerCase();
  const notifyAdmins = actorRole.includes("supervisor");
  const recipients = notifyAdmins
    ? await prisma.user.findMany({
        where: {
          companyId,
          isActive: true,
          role: { name: { in: ADMIN_ROLE_NAMES, mode: "insensitive" } },
        },
        select: { id: true },
      }).then((users) => users.map((user) => user.id))
    : jobCard.assignedSupervisorId
      ? [jobCard.assignedSupervisorId]
      : await prisma.user.findMany({
          where: {
            companyId,
            isActive: true,
            role: { name: { in: SUPERVISOR_ROLE_NAMES, mode: "insensitive" } },
          },
          select: { id: true },
        }).then((users) => users.map((user) => user.id));

  for (const userId of new Set(recipients.filter((id) => id && id !== actor?.id))) {
    await notifyUser(prisma, redisModule, {
      companyId,
      userId,
      ...notification,
      actorId: actor?.id || null,
      actorName: actor?.name || null,
      actorRole: actor?.role || null,
      entityType: "JobCard",
      entityId: jobCard.id,
    });
  }
}

async function recalcCost(jobCardId) {
  const [parts, jc] = await Promise.all([
    prisma.jobCardPart.findMany({ where: { jobCardId } }),
    prisma.jobCard.findUnique({
      where: { id: jobCardId },
      select: { actualLaborHours: true, laborRate: true },
    }),
  ]);
  const partsCost = parts.reduce(
    (s, p) => s + (parseFloat(p.totalCost) || 0),
    0,
  );
  const laborCost =
    (parseFloat(jc?.actualLaborHours) || 0) * (parseFloat(jc?.laborRate) || 0);
  return jobCardRepository.updateJobCard(jobCardId, {
    laborCost: parseFloat(laborCost.toFixed(2)),
    totalCost: parseFloat((partsCost + laborCost).toFixed(2)),
  });
}

class JobCardService {
  async createJobCard(companyId, payload, actor) {
    if (!payload.machineId)
      throw new Error("Machine ID is required to create a Job Card.");
    if (payload.assignedTechnicianId) {
      payload.assignedTechnicianName = await resolveStaff(
        companyId,
        payload.assignedTechnicianId,
        "artisan",
      );
    }
    if (payload.assignedSupervisorId) {
      payload.assignedSupervisorName = await resolveStaff(
        companyId,
        payload.assignedSupervisorId,
        "supervisor",
      );
    }
    if (
      payload.laborRate !== undefined &&
      !(parseFloat(payload.laborRate) >= 0)
    ) {
      throw new Error("Labour rate cannot be negative.");
    }

    if (!payload.title || !String(payload.title).trim()) {
      throw new Error("Job Card title or summary is required.");
    }
    const machine = await prisma.machine.findFirst({
      where: { id: payload.machineId, companyId },
      select: { id: true },
    });
    if (!machine) throw new Error("Machine not found for this company.");

    if (payload.componentId) {
      const component = await prisma.component.findFirst({
        where: { id: payload.componentId, machineId: payload.machineId },
        select: { id: true },
      });
      if (!component)
        throw new Error(
          "Selected component does not belong to the selected machine.",
        );
    }

    let maintenanceType = normalizeEnum(
      payload.maintenanceType || "PREVENTIVE",
    );
    maintenanceType = TYPE_ALIASES[maintenanceType] || maintenanceType;
    if (!MAINTENANCE_TYPES.includes(maintenanceType)) {
      throw new Error(
        `Invalid maintenance type. Allowed: ${MAINTENANCE_TYPES.join(", ")}`,
      );
    }
    const priority = normalizeEnum(payload.priority || "MEDIUM");
    if (!PRIORITIES.includes(priority)) {
      throw new Error(`Invalid priority. Allowed: ${PRIORITIES.join(", ")}`);
    }

    let jobCard;
    for (let attempt = 0; attempt < 3; attempt++) {
      const jobCardNumber =
        await jobCardRepository.generateNextJobCardNumber(companyId);
      try {
        jobCard = await jobCardRepository.createJobCard({
          ...payload,
          companyId,
          jobCardNumber,
          maintenanceType,
          priority,
          status: payload.assignedTechnicianId
            ? "ASSIGNED"
            : payload.status === "DRAFT"
              ? "DRAFT"
              : "OPEN",
        });
        break;
      } catch (err) {
        if (err.code !== "P2002" || attempt === 2) throw err;
      }
    }

    await audit(
      jobCard.id,
      actor,
      "JOB_CARD_CREATED",
      "Job Card created",
      `${actor?.name || "User"} created Job Card #${jobCard.jobCardNumber}.`,
      { newValue: jobCard.status },
    );

    if (jobCard.assignedTechnicianId) {
      await notifyUser(prisma, redisModule, {
        companyId,
        userId: jobCard.assignedTechnicianId,
        title: "New Task Assigned",
        message: `Job Card #${jobCard.jobCardNumber} - "${jobCard.title}" assigned to you`,
        type: "Task",
        severity: "info",
        actorId: actor?.id,
        actorName: actor?.name,
        actorRole: actor?.role,
        entityType: "JobCard",
        entityId: jobCard.id,
      });
    }

    return jobCard;
  }

  async createFromAlert(alertId, companyId, actor) {
    const alert = await prisma.alert.findFirst({
      where: { id: String(alertId), companyId },
    });
    if (!alert) throw new Error("Alert not found.");

    const tag = `[ALERT:${alert.id}]`;
    const duplicate = await prisma.jobCard.findFirst({
      where: {
        companyId,
        description: { contains: tag },
        status: { notIn: ["CANCELLED", "CLOSED"] },
      },
      select: { jobCardNumber: true },
    });
    if (duplicate)
      throw new Error(
        `Job Card ${duplicate.jobCardNumber} already exists for this alert.`,
      );

    const component = await prisma.component.findFirst({
      where: {
        machineId: alert.machineId,
        OR: [
          { name: { equals: alert.componentName, mode: "insensitive" } },
          {
            description: { contains: alert.componentName, mode: "insensitive" },
          },
        ],
      },
      select: { id: true },
    });

    const isCritical = String(alert.status).toLowerCase().includes("crit");
    const jobCard = await this.createJobCard(
      companyId,
      {
        machineId: alert.machineId,
        componentId: component?.id || null,
        title: `${alert.componentName} - ${alert.status} alert`,
        description: `${alert.message} ${tag}`,
        maintenanceType: isCritical ? "BREAKDOWN" : "CORRECTIVE",
        priority: isCritical ? "CRITICAL" : "HIGH",
      },
      actor,
    );

    await prisma.alert.update({
      where: { id: alert.id },
      data: { isRead: true },
    });
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

  async updateJobCard(id, companyId, updateData, actor) {
    const existing = await jobCardRepository.findJobCardById(id, companyId);
    if (!existing) throw new Error("Job Card not found.");
    if (["COMPLETED", "CLOSED", "CANCELLED"].includes(existing.status)) {
      throw new Error(`Job Card in status ${existing.status} is read-only.`);
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
      "laborRate",
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
        } else if (field === "allocatedLaborHours" || field === "laborRate") {
          dataToUpdate[field] = parseFloat(updateData[field]) || 0;
        } else {
          dataToUpdate[field] = updateData[field];
        }
      }
    }

    if (dataToUpdate.maintenanceType) {
      let t = normalizeEnum(dataToUpdate.maintenanceType);
      t = TYPE_ALIASES[t] || t;
      if (!MAINTENANCE_TYPES.includes(t)) {
        throw new Error(
          `Invalid maintenance type. Allowed: ${MAINTENANCE_TYPES.join(", ")}`,
        );
      }
      dataToUpdate.maintenanceType = t;
    }
    if (dataToUpdate.priority) {
      const p = normalizeEnum(dataToUpdate.priority);
      if (!PRIORITIES.includes(p))
        throw new Error(`Invalid priority. Allowed: ${PRIORITIES.join(", ")}`);
      dataToUpdate.priority = p;
    }
    if (dataToUpdate.componentId) {
      const component = await prisma.component.findFirst({
        where: { id: dataToUpdate.componentId, machineId: existing.machineId },
        select: { id: true },
      });
      if (!component)
        throw new Error("Selected component does not belong to this machine.");
    }

    if (dataToUpdate.assignedTechnicianId) {
      dataToUpdate.assignedTechnicianName = await resolveStaff(
        companyId,
        dataToUpdate.assignedTechnicianId,
        "artisan",
      );
    }
    if (dataToUpdate.assignedSupervisorId) {
      dataToUpdate.assignedSupervisorName = await resolveStaff(
        companyId,
        dataToUpdate.assignedSupervisorId,
        "supervisor",
      );
    }
    if (
      dataToUpdate.laborRate !== undefined &&
      !(dataToUpdate.laborRate >= 0)
    ) {
      throw new Error("Labour rate cannot be negative.");
    }

    if (
      dataToUpdate.assignedTechnicianId &&
      ["DRAFT", "OPEN"].includes(existing.status)
    ) {
      dataToUpdate.status = "ASSIGNED";
    }

    const updated = await jobCardRepository.updateJobCard(id, dataToUpdate);
    if (dataToUpdate.laborRate !== undefined) await recalcCost(id);

    await audit(
      id,
      actor,
      "JOB_CARD_UPDATED",
      "Job Card updated",
      `${actor?.name || "User"} updated: ${Object.keys(dataToUpdate).join(", ") || "no fields"}.`,
    );

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
        actorId: actor?.id,
        actorName: actor?.name,
        actorRole: actor?.role,
        entityType: "JobCard",
        entityId: id,
      });
    }

    return updated;
  }

  async updateStatus(id, companyId, body, actor) {
    const {
      status,
      rootCause,
      correctiveAction,
      postRepairCondition,
      downtimeHours,
    } = body || {};
    const jobCard = await jobCardRepository.findJobCardById(id, companyId);
    if (!jobCard) throw new Error("Job Card not found.");

    if (!STATUS_FLOW[status]) throw new Error("Invalid status.");
    if (status === "COMPLETED" || status === "CLOSED") {
      throw forbidden(
        "COMPLETED and CLOSED can only be set through the approval step.",
      );
    }
    if (!(STATUS_FLOW[jobCard.status] || []).includes(status)) {
      throw new Error(
        `Cannot change status from ${jobCard.status} to ${status}.`,
      );
    }

    if (!isManager(actor)) {
      if (!isAssignedTechnician(jobCard, actor)) {
        throw forbidden(
          "Only the assigned technician or a Supervisor/Admin can change this status.",
        );
      }
      if (!TECH_STATUSES.includes(status)) {
        throw forbidden("Only a Supervisor or Admin can set this status.");
      }
    }

    const updateData = { status };

    if (status === "IN_PROGRESS" && !jobCard.actualStartDate) {
      updateData.actualStartDate = new Date();
    }
    if (status === "IN_PROGRESS" && jobCard.status === "WAITING_FOR_APPROVAL") {
      updateData.actualFinishDate = null;
    }

    if (status === "WAITING_FOR_APPROVAL") {
      if (jobCard.laborLogs.some((l) => !l.endTime)) {
        throw new Error(
          "Finish the running timer before submitting the report.",
        );
      }
      const finalRoot = String(rootCause ?? jobCard.rootCause ?? "").trim();
      const finalAction = String(
        correctiveAction ?? jobCard.correctiveAction ?? "",
      ).trim();
      if (!finalRoot)
        throw new Error("Root cause is required to submit the repair report.");
      if (!finalAction)
        throw new Error(
          "Corrective action is required to submit the repair report.",
        );
      updateData.rootCause = finalRoot;
      updateData.correctiveAction = finalAction;

      if (
        postRepairCondition !== undefined &&
        postRepairCondition !== null &&
        postRepairCondition !== ""
      ) {
        const cond = parseInt(postRepairCondition, 10);
        if (!(cond >= 1 && cond <= 5))
          throw new Error("Post-repair condition must be between 1 and 5.");
        updateData.postRepairCondition = String(cond);
      }
      if (
        downtimeHours !== undefined &&
        downtimeHours !== null &&
        downtimeHours !== ""
      ) {
        const d = parseFloat(downtimeHours);
        if (!(d >= 0)) throw new Error("Downtime hours must be 0 or more.");
        updateData.downtimeHours = d;
      }
      updateData.actualFinishDate = jobCard.actualFinishDate || new Date();
    }

    const updated = await jobCardRepository.updateJobCard(id, updateData);

    await audit(
      id,
      actor,
      "STATUS_CHANGED",
      `Status changed to ${status}`,
      `${actor?.name || "User"} changed status from ${jobCard.status} to ${status}.`,
      { fieldChanged: "status", oldValue: jobCard.status, newValue: status },
    );

    const statusNotification = {
      title:
        status === "WAITING_FOR_APPROVAL"
          ? "Job Card Report Submitted"
          : status === "IN_PROGRESS"
            ? "Job Card Work Started"
            : "Job Card Status Updated",
      message:
        status === "WAITING_FOR_APPROVAL"
          ? `Report submitted for Job Card #${jobCard.jobCardNumber}; review is required.`
          : status === "IN_PROGRESS"
            ? `Work started on Job Card #${jobCard.jobCardNumber}.`
            : `Job Card #${jobCard.jobCardNumber} status changed to ${status}`,
      type: "Task",
    };
    if (["IN_PROGRESS", "WAITING_FOR_APPROVAL"].includes(status)) {
      await notifyJobCardReviewers(companyId, jobCard, actor, statusNotification);
    } else {
      const notifyTargets = [
        jobCard.assignedTechnicianId,
        jobCard.assignedSupervisorId,
      ]
        .filter(Boolean)
        .filter((uid) => uid !== actor?.id);
      for (const targetUserId of notifyTargets) {
        await notifyUser(prisma, redisModule, {
          companyId,
          userId: targetUserId,
          ...statusNotification,
          actorId: actor?.id || null,
          actorName: actor?.name || null,
          actorRole: actor?.role || null,
          entityType: "JobCard",
          entityId: id,
        });
      }
    }

    return updated;
  }

  async logLaborTimer(id, companyId, { actionType, notes }, actor) {
    const jobCard = await jobCardRepository.findJobCardById(id, companyId);
    if (!jobCard) throw new Error("Job Card not found.");
    assertWorkable(jobCard, actor);

    const action = String(actionType || "").toUpperCase();
    if (!["START", "RESUME", "PAUSE", "FINISH"].includes(action)) {
      throw new Error("actionType must be START, RESUME, PAUSE or FINISH.");
    }

    const now = new Date();
    const openLog = jobCard.laborLogs.find((l) => !l.endTime);

    if (action === "START" || action === "RESUME") {
      if (
        !["ASSIGNED", "IN_PROGRESS", "WAITING_FOR_PARTS"].includes(
          jobCard.status,
        )
      ) {
        throw new Error("Timer can start only on an assigned job card.");
      }
      if (openLog) throw new Error("Timer is already running.");

      await jobCardRepository.addLaborLog(id, {
        artisanId: actor.id,
        artisanName: actor.name,
        startTime: now,
        actionType: "WORK",
        notes,
      });

      if (jobCard.status !== "IN_PROGRESS") {
        await jobCardRepository.updateJobCard(id, {
          status: "IN_PROGRESS",
          actualStartDate: jobCard.actualStartDate || now,
        });
        await notifyJobCardReviewers(companyId, jobCard, actor, {
          title: "Job Card Work Started",
          message: `Work started on Job Card #${jobCard.jobCardNumber}.`,
          type: "Task",
        });
      }
    } else {
      if (!openLog) throw new Error("No running timer to stop.");

      const durationMinutes = Math.max(
        1,
        Math.round((now - new Date(openLog.startTime)) / (1000 * 60)),
      );
      await prisma.jobCardLaborLog.update({
        where: { id: openLog.id },
        data: { endTime: now, durationMinutes, notes: notes || openLog.notes },
      });

      const allLogs = await prisma.jobCardLaborLog.findMany({
        where: { jobCardId: id },
      });
      const totalMinutes = allLogs.reduce(
        (sum, log) => sum + (log.durationMinutes || 0),
                0,
      );
      await jobCardRepository.updateJobCard(id, {
        actualLaborHours: parseFloat((totalMinutes / 60).toFixed(2)),
      });
      await recalcCost(id);
    }

    await audit(
      id,
      actor,
      `TIMER_${action}`,
      `Timer ${action.toLowerCase()}`,
      `${actor?.name || "User"} pressed ${action} on the work timer.`,
    );

    return await this.getJobCardById(id, companyId);
  }
  async addPart(id, companyId, partData, actor) {
    const jobCard = await jobCardRepository.findJobCardById(id, companyId);
    if (!jobCard) throw new Error("Job Card not found.");
    assertWorkable(jobCard, actor);

    if (!partData?.partName || !String(partData.partName).trim())
      throw new Error("Part name is required.");
    const qty = parseInt(partData.quantity, 10);
    if (!(qty > 0)) throw new Error("Quantity must be at least 1.");
    if (
      partData.unitCost !== undefined &&
      partData.unitCost !== "" &&
      !(parseFloat(partData.unitCost) >= 0)
    ) {
      throw new Error("Unit cost cannot be negative.");
    }

    const part = await jobCardRepository.addPart(id, partData);

    await recalcCost(id);

    await audit(
      id,
      actor,
      "PART_ADDED",
      `Part added: ${partData.partName}`,
      `${actor?.name || "User"} added ${qty} x "${partData.partName}".`,
    );

    if (
      jobCard.assignedSupervisorId &&
      jobCard.assignedSupervisorId !== actor?.id
    ) {
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

  async addInspectionFinding(id, companyId, findingData, actor) {
    const jobCard = await jobCardRepository.findJobCardById(id, companyId);
    if (!jobCard) throw new Error("Job Card not found.");
    assertWorkable(jobCard, actor);
    if (
      !findingData?.parameterName ||
      !String(findingData.parameterName).trim()
    ) {
      throw new Error("Parameter name is required.");
    }

    const finding = await jobCardRepository.addInspectionFinding(
      id,
      findingData,
    );

    await audit(
      id,
      actor,
      "FINDING_ADDED",
      `Finding added: ${findingData.parameterName}`,
      `${actor?.name || "User"} recorded "${findingData.parameterName}".`,
    );

    if (
      jobCard.assignedSupervisorId &&
      jobCard.assignedSupervisorId !== actor?.id
    ) {
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

  async addAttachment(id, companyId, attachmentData, actor) {
    const jobCard = await jobCardRepository.findJobCardById(id, companyId);
    if (!jobCard) throw new Error("Job Card not found.");
    assertWorkable(jobCard, actor);
    if (!attachmentData?.fileName || !attachmentData?.fileUrl) {
      throw new Error("fileName and fileUrl are required.");
    }

    const attachment = await jobCardRepository.addAttachment(id, {
      ...attachmentData,
      uploadedBy: actor?.name || attachmentData.uploadedBy,
    });

    await audit(
      id,
      actor,
      "ATTACHMENT_ADDED",
      `Attachment added: ${attachmentData.fileName}`,
      `${actor?.name || "User"} uploaded "${attachmentData.fileName}".`,
    );

    return attachment;
  }

  async deleteAttachment(id, companyId, attachmentId, actor) {
    const jobCard = await jobCardRepository.findJobCardById(id, companyId);
    if (!jobCard) throw new Error("Job Card not found.");
    assertWorkable(jobCard, actor);

    const attachment = await jobCardRepository.findAttachmentById(attachmentId);
    if (!attachment || attachment.jobCardId !== id) {
      throw new Error("Attachment not found on this Job Card.");
    }

    const deleted = await jobCardRepository.deleteAttachment(attachmentId);

    await audit(
      id,
      actor,
      "ATTACHMENT_DELETED",
      `Attachment removed: ${attachment.fileName}`,
      `${actor?.name || "User"} removed "${attachment.fileName}".`,
    );

    return deleted;
  }

  async closeJobCard(jobCard, updateData) {
    const ops = [
      prisma.jobCard.update({ where: { id: jobCard.id }, data: updateData }),
      prisma.maintenanceLog.create({
        data: {
          companyId: jobCard.companyId,
          machineId: jobCard.machineId,
          componentId: jobCard.componentId || null,
          technician: jobCard.assignedTechnicianName || "Unassigned",
          date: jobCard.actualFinishDate || new Date(),
          work: `[${jobCard.jobCardNumber}] ${jobCard.title}${jobCard.correctiveAction ? " - " + jobCard.correctiveAction : ""}`,
          cost: Number(jobCard.totalCost) || 0,
          downtime: `${Number(jobCard.downtimeHours) || 0} hrs`,
          status: "Completed",
        },
      }),
    ];

    if (jobCard.componentId) {
      const comp = await prisma.component.findUnique({
        where: { id: jobCard.componentId },
      });
      if (comp) {
        const postCond = parseInt(jobCard.postRepairCondition, 10);
        const compData = { lastInspectedAt: new Date() };
        if (postCond >= 1 && postCond <= 5) compData.condition = postCond;
        if (
          ["COMPONENT_REPLACEMENT", "REBUILD"].includes(jobCard.maintenanceType)
        ) {
          compData.installHours = comp.currentHours;
          compData.currentLifeHours = 0;
          compData.installDate = new Date();
          if (!compData.condition) compData.condition = 1;
        }
        ops.push(
          prisma.component.update({ where: { id: comp.id }, data: compData }),
        );
      }
    }

    await prisma.$transaction(ops);
    return jobCardRepository.findJobCardById(jobCard.id, jobCard.companyId);
  }

  async approveJobCard(id, companyId, { actor, notes }) {
    const jobCard = await jobCardRepository.findJobCardById(id, companyId);
    if (!jobCard) throw new Error("Job Card not found.");

    const role = String(actor?.role || "").toLowerCase();
    const canApprove = role.includes("supervisor") || role.includes("admin");

    if (jobCard.status !== "WAITING_FOR_APPROVAL") {
      throw new Error(
        `Job Card in status ${jobCard.status} cannot be approved.`,
      );
    }
    if (!canApprove) {
      throw forbidden("Only a Supervisor or Admin can approve this Job Card.");
    }
    const updateData = {
      supervisorApprovedAt: new Date(),
      supervisorNotes: notes || `Approved by ${actor?.role || "reviewer"}`,
      status: "CLOSED",
      closedAt: new Date(),
    };
    const action = "SUPERVISOR_APPROVED";
    const title = "Job Card approved and closed";

    const updated = await this.closeJobCard(jobCard, updateData);

    await audit(
      id,
      actor,
      action,
      title,

      `${actor.name} (${actor.role}) ${title.toLowerCase()}.`,
      {
        fieldChanged: "status",
        oldValue: jobCard.status,
        newValue: updateData.status,
      },
    );

    await notifyJobCardApprovalRecipient(companyId, jobCard, actor, {
      title: "Job Card Approved",
      message: `Job Card #${jobCard.jobCardNumber}: ${title}`,
      type: "Task",
      severity: "success",
    });

    return updated;
  }

  async getReliabilityMetrics(companyId) {
    const closedJobs = await prisma.jobCard.findMany({
      where: { companyId, status: { in: ["COMPLETED", "CLOSED"] } },
      select: {
        maintenanceType: true,
        actualLaborHours: true,
        downtimeHours: true,
        totalCost: true,
        actualFinishDate: true,
        plannedFinishDate: true,
      },
    });

    const withLabor = closedJobs.filter(
      (j) => (parseFloat(j.actualLaborHours) || 0) > 0,
    );
    const mttrHours =
      withLabor.length > 0
        ? parseFloat(
            (
              withLabor.reduce(
                (s, j) => s + parseFloat(j.actualLaborHours),
                0,
              ) / withLabor.length
            ).toFixed(1),
          )
        : null;

    const pmJobs = closedJobs.filter(
      (j) =>
        j.maintenanceType === "PREVENTIVE" &&
        j.actualFinishDate &&
        j.plannedFinishDate,
    );
    const onTimePm = pmJobs.filter(
      (j) => new Date(j.actualFinishDate) <= new Date(j.plannedFinishDate),
    ).length;
    const pmCompliancePercent =
      pmJobs.length > 0 ? Math.round((onTimePm / pmJobs.length) * 100) : null;

    const breakdowns = await prisma.jobCard.findMany({
      where: {
        companyId,
        maintenanceType: "BREAKDOWN",
        status: { not: "CANCELLED" },
      },
      select: { machineId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    const byMachine = {};
    for (const b of breakdowns)
      (byMachine[b.machineId] ||= []).push(b.createdAt.getTime());
    const gaps = [];
    for (const times of Object.values(byMachine)) {
      for (let i = 1; i < times.length; i++)
        gaps.push((times[i] - times[i - 1]) / 3600000);
    }
    const mtbfHours = gaps.length
      ? parseFloat((gaps.reduce((s, g) => s + g, 0) / gaps.length).toFixed(1))
      : null;

    const breakdownCount = closedJobs.filter(
      (j) => j.maintenanceType === "BREAKDOWN",
    ).length;
    const totalDowntimeHours = closedJobs.reduce(
      (s, j) => s + (parseFloat(j.downtimeHours) || 0),
      0,
    );
    const totalMaintenanceCost = closedJobs.reduce(
      (s, j) => s + (parseFloat(j.totalCost) || 0),
      0,
    );

    return {
      mttrHours,
            mtbfHours,
      pmCompliancePercent,
      breakdownCount,
      totalDowntimeHours: parseFloat(totalDowntimeHours.toFixed(1)),
      totalMaintenanceCost: parseFloat(totalMaintenanceCost.toFixed(2)),
    };
  }

  async getDashboard(companyId) {
    const [cards, summary, parts, reliability] = await Promise.all([
      prisma.jobCard.findMany({
        where: { companyId },
        select: {
          machineId: true,
          componentId: true,
          assignedTechnicianId: true,
          assignedTechnicianName: true,
          priority: true,
          maintenanceType: true,
          actualLaborHours: true,
          downtimeHours: true,
          totalCost: true,
          createdAt: true,
          machine: { select: { name: true } },
          component: { select: { name: true, description: true } },
        },
      }),
      jobCardRepository.getStatusSummary(companyId),
      prisma.jobCardPart.groupBy({
        by: ["partName"],
        where: { jobCard: { companyId } },
        _sum: { quantity: true, totalCost: true },
      }),
      this.getReliabilityMetrics(companyId),
    ]);

    const group = (keyFn, labelFn) => {
      const map = new Map();
      for (const c of cards) {
        const key = keyFn(c);
        if (!key) continue;
        const row = map.get(key) || {
          key,
          label: labelFn(c),
          jobs: 0,
          laborHours: 0,
          downtimeHours: 0,
          cost: 0,
        };
        row.jobs += 1;
        row.laborHours += parseFloat(c.actualLaborHours) || 0;
        row.downtimeHours += parseFloat(c.downtimeHours) || 0;
        row.cost += parseFloat(c.totalCost) || 0;
        map.set(key, row);
      }
      return [...map.values()]
        .map((r) => ({
          ...r,
          laborHours: +r.laborHours.toFixed(2),
          downtimeHours: +r.downtimeHours.toFixed(2),
          cost: +r.cost.toFixed(2),
        }))
        .sort((a, b) => b.jobs - a.jobs);
    };

    const breakdownTrend = {};
    for (const c of cards) {
      if (c.maintenanceType !== "BREAKDOWN") continue;
      const k = c.createdAt.toISOString().slice(0, 7);
      breakdownTrend[k] = (breakdownTrend[k] || 0) + 1;
    }

    return {
      summary,
      reliability,
      byMachine: group(
        (c) => c.machineId,
        (c) => c.machine?.name || "Unknown",
      ),
      byComponent: group(
        (c) => c.componentId,
        (c) => c.component?.name || c.component?.description || "Unknown",
      ),
      byTechnician: group(
        (c) => c.assignedTechnicianId,
        (c) => c.assignedTechnicianName || "Unknown",
      ),
      byPriority: group(
        (c) => c.priority,
        (c) => c.priority,
      ),
      partsConsumption: parts.map((p) => ({
        partName: p.partName,
        quantity: p._sum.quantity || 0,
        cost: parseFloat(p._sum.totalCost) || 0,
      })),
      breakdownTrend: Object.entries(breakdownTrend)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count })),
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

}

module.exports = new JobCardService();
