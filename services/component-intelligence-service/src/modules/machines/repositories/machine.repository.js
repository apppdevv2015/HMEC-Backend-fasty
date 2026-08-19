const prisma = require('../../../database/prismaClient');

async function resolveCompanyId(companyId) {
    if (!companyId) return null;
    try {
        const company = await prisma.company.findFirst({
            where: {
                OR: [
                    { id: companyId },
                    { companyCode: companyId }
                ]
            }
        });
        return company ? company.id : null;
    } catch (e) {
        return null;
    }
}

function computeComponentMetrics(comp) {
    const plannedLife = Number(comp.plannedLife || 2000) <= 0 ? 2000 : Number(comp.plannedLife);
    const currentHours = Number(comp.currentHours || 0);
    const installHours = Number(comp.installHours || 0);
    const condition = Number(comp.condition || 3);

    const hoursRun = Math.max(0, currentHours - installHours);
    const lifeUsedPercent = Math.min(100, Math.max(0, Math.round((hoursRun / plannedLife) * 100)));
    const healthScore = Math.max(0, 100 - lifeUsedPercent);

    let status = 'Healthy';
    if (condition >= 5 || lifeUsedPercent >= 95) {
        status = 'Critical';
    } else if (condition >= 4 || lifeUsedPercent >= 85) {
        status = 'Warning';
    } else if (condition >= 3 || lifeUsedPercent >= 70) {
        status = 'Monitor';
    }

    const compName = comp.name || (comp.description ? comp.description.split(" - ")[0].trim() : "Component");

    return {
        ...comp,
        name: compName,
        serialNumber: comp.serialNumber ? comp.serialNumber.replace(/^DEMO-/i, '') : comp.serialNumber,
        hoursRun,
        lifeUsedPercent,
        healthScore,
        status
    };
}

async function enrichMachinesWithCompany(machines) {
    if (!machines) return machines;
    const isArray = Array.isArray(machines);
    const list = isArray ? machines : [machines];
    if (list.length === 0) return machines;

    const companyIds = [...new Set(list.map(m => m?.companyId).filter(Boolean))];
    let companyMap = new Map();
    if (companyIds.length > 0) {
        try {
            const companies = await prisma.company.findMany({
                where: { id: { in: companyIds } },
                select: {
                    id: true,
                    companyCode: true,
                    name: true
                }
            });
            companies.forEach(comp => companyMap.set(comp.id, comp));
        } catch (err) {
            console.error('[ENRICH_MACHINES_ERROR]: Failed to fetch company details:', err.message);
        }
    }

    const enriched = list.map(m => {
        const company = m?.companyId ? companyMap.get(m.companyId) : null;
        const comps = Array.isArray(m?.components) ? m.components.map(computeComponentMetrics) : [];

        const hasManualInspection = m.healthScore !== null && m.healthScore !== undefined;

        let avgHealth = hasManualInspection ? Number(m.healthScore) : null;
        let machineStatus = hasManualInspection ? m.status : null;

        return {
            ...m,
            serialNumber: m?.serialNumber ? m.serialNumber.replace(/^DEMO-/i, '') : m?.serialNumber,
            componentsCount: comps.length,
            components: comps,
            healthScore: avgHealth,
            status: machineStatus,
            companyCode: company?.companyCode || null,
            companyName: company?.name || null
        };
    });

    return isArray ? enriched : enriched[0];
}

class MachineRepository {
    async create(data) {
        const machine = await prisma.machine.create({ data });
        return await enrichMachinesWithCompany(machine);
    }

    async findAll(companyId) {
        const whereClause = (companyId && companyId !== 'all') ? { companyId } : {};
        const machines = await prisma.machine.findMany({
            where: whereClause,
            include: { 
                components: true
            }
        });
        return await enrichMachinesWithCompany(machines);
    }

    async findPaginated({ companyId, search, page = 1, limit = 10 }) {
        const whereClause = {};
        if (companyId && companyId !== 'all') {
            whereClause.companyId = companyId;
        }

        if (search && search.trim()) {
            const q = search.trim();
            whereClause.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { manufacturer: { contains: q, mode: 'insensitive' } },
                { model: { contains: q, mode: 'insensitive' } },
                { serialNumber: { contains: q, mode: 'insensitive' } },
                { equipmentType: { contains: q, mode: 'insensitive' } },
                { site: { contains: q, mode: 'insensitive' } },
                { assignedOperatorName: { contains: q, mode: 'insensitive' } },
                { assignedArtisanName: { contains: q, mode: 'insensitive' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const [totalItems, rawMachines] = await Promise.all([
            prisma.machine.count({ where: whereClause }),
            prisma.machine.findMany({
                where: whereClause,
                skip,
                take,
                include: { components: true },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        const machines = await enrichMachinesWithCompany(rawMachines);
        const totalPages = Math.ceil(totalItems / limit) || 1;

        return {
            page: Number(page),
            limit: Number(limit),
            totalItems,
            totalPages,
            data: machines
        };
    }

    async findById(id) {
        const machine = await prisma.machine.findUnique({
            where: { id },
            include: { components: true }
        });
        return await enrichMachinesWithCompany(machine);
    }

    async countMachinesByCompany(companyId) {
        return await prisma.machine.count({
            where: { companyId }
        });
    }

    async getCompanyActiveSubscription(companyId) {
        // Query the subscriptions to find the active plan for the company
        return await prisma.subscription.findFirst({
            where: { 
                companyId: companyId,
                status: 'active'
            },
            include: {
                plan: true
            }
        });
    }

    async getCategories(companyId, includeInactive = false) {
        const whereClause = {};
        if (!includeInactive) {
            whereClause.isActive = true;
        }
        if (companyId && companyId !== 'all') {
            const validCompanyId = await resolveCompanyId(companyId);
            whereClause.OR = [
                { companyId: companyId },
                ...(validCompanyId ? [{ companyId: validCompanyId }] : []),
                { companyId: null }
            ];
        }
        return await prisma.machineCategory.findMany({
            where: whereClause,
            orderBy: { name: 'asc' }
        });
    }

    async createCategory(data) {
        const validCompanyId = await resolveCompanyId(data.companyId);
        const payload = {
            name: data.name,
            description: data.description || null,
            icon: data.icon || null,
            isActive: data.isActive !== undefined ? data.isActive : true,
            companyId: validCompanyId
        };
        return await prisma.machineCategory.create({ data: payload });
    }

    async updateCategory(id, data) {
        return await prisma.machineCategory.update({
            where: { id },
            data
        });
    }

    async deleteCategory(id) {
        return await prisma.machineCategory.delete({
            where: { id }
        });
    }

    async update(id, data) {
        const machine = await prisma.machine.update({
            where: { id },
            data,
            include: { components: true }
        });
        return await enrichMachinesWithCompany(machine);
    }

    async delete(id) {
        return await prisma.machine.delete({
            where: { id }
        });
    }
}

module.exports = new MachineRepository();
