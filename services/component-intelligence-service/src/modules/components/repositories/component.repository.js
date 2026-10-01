const prisma = require("../../../database/prismaClient");

async function resolveCompanyId(companyId) {
  if (!companyId) return null;
  try {
    const company = await prisma.company.findFirst({
      where: {
        OR: [{ id: companyId }, { companyCode: companyId }],
      },
    });
    return company ? company.id : null;
  } catch (e) {
    return null;
  }
}

async function enrichComponentsWithCompany(components) {
  if (!components) return components;
  const isArray = Array.isArray(components);
  const list = isArray ? components : [components];
  if (list.length === 0) return components;

  const companyIds = [
    ...new Set(list.map((c) => c?.machine?.companyId).filter(Boolean)),
  ];

  let companyMap = new Map();
  if (companyIds.length > 0) {
    try {
      const companies = await prisma.company.findMany({
        where: { id: { in: companyIds } },
        select: {
          id: true,
          companyCode: true,
          name: true,
        },
      });
      companies.forEach((comp) => companyMap.set(comp.id, comp));
    } catch (err) {
      console.error(
        "[ENRICH_COMPONENTS_ERROR]: Failed to fetch company details:",
        err.message,
      );
    }
  }

  const enriched = list.map((c) => {
    const company = c?.machine?.companyId
      ? companyMap.get(c.machine.companyId)
      : null;

    const enrichedMachine = c?.machine
      ? {
          ...c.machine,
          serialNumber: c.machine.serialNumber
            ? c.machine.serialNumber.replace(/^DEMO-/i, "")
            : c.machine.serialNumber,
          companyCode: company?.companyCode || null,
          companyName: company?.name || null,
        }
      : null;

    const compName =
      c.name || (c.description ? c.description.split(" - ")[0].trim() : null);

    return {
      id: c.id,
      name: compName,
      serialNumber: c?.serialNumber
        ? c.serialNumber.replace(/^DEMO-/i, "")
        : c?.serialNumber,
      description: c.description || null,
      supplier: c.supplier || null,
      installHours: c.installHours ?? 0,
      currentHours: c.currentHours ?? 0,
      plannedLife: c.plannedLife ?? 0,
      replacementCost: c.replacementCost ? String(c.replacementCost) : "0",
            leadTimeWeeks: c.leadTimeWeeks ?? null,
      currency: c.currency || "ZAR",
      dailyUsageHours:
        c.dailyUsageHours !== null && c.dailyUsageHours !== undefined
          ? Number(c.dailyUsageHours)
          : null,
      category: c.category || null,
      assignedSupervisorId: c.assignedSupervisorId || null,
      condition: c.condition ?? 3,
      machineId: c.machineId,
      companyId: c.companyId || (c.machine ? c.machine.companyId : null),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      machine: enrichedMachine
        ? {
            id: enrichedMachine.id,
            name: enrichedMachine.name,
            manufacturer: enrichedMachine.manufacturer,
            model: enrichedMachine.model,
            serialNumber: enrichedMachine.serialNumber,
            equipmentType: enrichedMachine.equipmentType,
            companyCode: enrichedMachine.companyCode,
            companyName: enrichedMachine.companyName,
          }
        : null,
    };
  });

  return isArray ? enriched : enriched[0];
}

function parseCondition(cond) {
  if (typeof cond === "number")
    return Math.min(Math.max(Math.round(cond), 1), 5);
  if (!cond) return 3;
  const s = String(cond).toLowerCase().trim();
  if (s.includes("excel") || s === "1") return 1;
  if (s.includes("good") || s === "2") return 2;
  if (s.includes("fair") || s === "3") return 3;
  if (s.includes("poor") || s === "4") return 4;
  if (s.includes("crit") || s === "5") return 5;
  const n = parseInt(s, 10);
  return !isNaN(n) ? Math.min(Math.max(n, 1), 5) : 3;
}

function sanitizeComponentPayload(data) {
  if (!data || typeof data !== "object") return {};
  const payload = {};

  if (data.name !== undefined) payload.name = String(data.name || "").trim();
  if (data.description !== undefined)
    payload.description = String(data.description || "").trim();
  if (data.supplier !== undefined)
    payload.supplier = data.supplier ? String(data.supplier).trim() : null;
  if (data.category !== undefined)
    payload.category = data.category ? String(data.category).trim() : null;
  if (data.componentType !== undefined)
    payload.componentType = data.componentType
      ? String(data.componentType).trim()
      : null;
  if (data.installHours !== undefined)
    payload.installHours = Number(data.installHours) || 0;
  if (data.currentHours !== undefined)
    payload.currentHours = Number(data.currentHours) || 0;
  if (data.plannedLife !== undefined)
    payload.plannedLife = Number(data.plannedLife) || 0;
  if (data.replacementCost !== undefined)
    payload.replacementCost = String(data.replacementCost || 0);
  if (data.leadTimeWeeks !== undefined) {
    payload.leadTimeWeeks =
      data.leadTimeWeeks === null || data.leadTimeWeeks === ""
        ? null
        : Number(data.leadTimeWeeks);
  }

   if (data.condition !== undefined)
    payload.condition = parseCondition(data.condition);
  if (data.currency !== undefined)
    payload.currency = String(data.currency || "ZAR").trim().toUpperCase();
  if (data.dailyUsageHours !== undefined)
    payload.dailyUsageHours =
      data.dailyUsageHours === null || data.dailyUsageHours === ""
        ? null
        : Number(data.dailyUsageHours);

  if (data.healthScore !== undefined || data.health !== undefined) {
    payload.healthScore = Number(data.healthScore ?? data.health) || 100;
  }
  if (data.parameters || data.inspectionParameters) {
    payload.inspectionParameters = data.parameters || data.inspectionParameters;
  }
  if (data.assignedArtisanId !== undefined)
    payload.assignedArtisanId = data.assignedArtisanId;
  if (data.assignedArtisanName !== undefined)
    payload.assignedArtisanName = data.assignedArtisanName;
  if (data.assignedSupervisorId !== undefined)
    payload.assignedSupervisorId = data.assignedSupervisorId;
  if (data.assignedSupervisorName !== undefined)
    payload.assignedSupervisorName = data.assignedSupervisorName;
  if (data.assignedStartDate !== undefined)
    payload.assignedStartDate = data.assignedStartDate
      ? new Date(data.assignedStartDate)
      : null;
  if (data.assignedDueDate !== undefined)
    payload.assignedDueDate = data.assignedDueDate
      ? new Date(data.assignedDueDate)
      : null;
  if (data.assignedWorkScope !== undefined)
    payload.assignedWorkScope = data.assignedWorkScope;
  if (data.assignedPriority !== undefined)
    payload.assignedPriority = data.assignedPriority;

  return payload;
}

class ComponentRepository {
  async create(data) {
    const payload = sanitizeComponentPayload(data);
    payload.machineId = data.machineId || data.machine?.id || null;
    payload.companyId = data.companyId || null;
    payload.serialNumber = data.serialNumber
      ? String(data.serialNumber)
      : `COMP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;

    const component = await prisma.component.create({
      data: payload,
      include: {
        machine: true,
      },
    });
    return await enrichComponentsWithCompany(component);
  }

  async findAll(companyId, machineId) {
    if (!companyId) throw new Error("Company ID is required");
    const where = {};

    const validCompanyId = await resolveCompanyId(companyId);

    if (companyId && companyId !== "all") {
      where.OR = [
        { companyId: companyId },
        ...(validCompanyId ? [{ companyId: validCompanyId }] : []),
        { machine: { companyId: companyId } },
        ...(validCompanyId ? [{ machine: { companyId: validCompanyId } }] : []),
      ];
    }
    if (machineId) {
      where.machineId = machineId;
    }

    const components = await prisma.component.findMany({
      where,
      include: {
        machine: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return await enrichComponentsWithCompany(components);
  }

  async findAllForEngineerDashboard(companyId) {
    if (!companyId) {
      throw new Error("Company ID is required");
    }

    const validCompanyId = await resolveCompanyId(companyId);

    const companyIds = [companyId, ...(validCompanyId ? [validCompanyId] : [])];

    const components = await prisma.component.findMany({
      where: {
        OR: [
          { companyId: { in: companyIds } },
          {
            machine: {
              companyId: { in: companyIds },
            },
          },
        ],
      },
      include: {
        machine: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return components;
  }

  async findByMachineId(machineId, companyId) {
    if (!machineId) return [];

    let targetIds = [machineId];

    try {
      const machine = await prisma.machine.findFirst({
        where: {
          OR: [
            { id: machineId },
            { name: { equals: machineId, mode: "insensitive" } },
            { serialNumber: { equals: machineId, mode: "insensitive" } },
          ],
          ...(companyId ? { companyId } : {}),
        },
      });

      if (machine) {
        targetIds = [
          ...new Set(
            [machine.id, machine.name, machine.serialNumber].filter(Boolean),
          ),
        ];
      }
    } catch (e) {
      console.error("[FIND_BY_MACHINE_ID_ERROR]:", e.message);
    }

    const components = await prisma.component.findMany({
      where: {
        machineId: { in: targetIds },
        ...(companyId ? { machine: { companyId } } : {}),
      },
      include: { machine: true },
      orderBy: { createdAt: "desc" },
    });

    return await enrichComponentsWithCompany(components);
  }

  async findById(id) {
    try {
      const component = await prisma.component.findFirst({
        where: {
          OR: [{ id: String(id) }, { serialNumber: String(id) }],
        },
        include: { machine: true },
      });
      return await enrichComponentsWithCompany(component);
    } catch (err) {
      console.warn("[COMPONENT_FIND_BY_ID_WARN]:", err.message);
      return null;
    }
  }

      async update(id, data, companyId) {
        const payload = sanitizeComponentPayload(data);
        delete payload.machineId; 

        const existing = await prisma.component.findFirst({
            where: {
                OR: [{ id: String(id) }, { serialNumber: String(id) }],
                ...(companyId ? { machine: { companyId } } : {})
            }
        });
        if (!existing) throw new Error('Component not found');

        const component = await prisma.component.update({
            where: { id: existing.id },
            data: payload,
            include: { machine: true }
        });
        return await enrichComponentsWithCompany(component);
    }

      async delete(id, companyId) {
        const existing = await prisma.component.findFirst({
            where: {
                OR: [{ id: String(id) }, { serialNumber: String(id) }],
                ...(companyId ? { machine: { companyId } } : {})
            }
        });
        if (!existing) throw new Error('Component not found');

        try {
            await prisma.$transaction([
                prisma.componentHealth.deleteMany({
                    where: { OR: [{ componentId: existing.id }, { serialNumber: existing.serialNumber }] }
                }),
                prisma.component.delete({ where: { id: existing.id } })
            ]);
        } catch (err) {
            if (err.code === 'P2003') {
                throw new Error('Cannot delete: this component has job cards or maintenance history.');
            }
            throw err;
        }
        return { id: existing.id, deleted: true };
    }
}

module.exports = new ComponentRepository();
