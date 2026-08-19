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

async function enrichComponentsWithCompany(components) {
    if (!components) return components;
    const isArray = Array.isArray(components);
    const list = isArray ? components : [components];
    if (list.length === 0) return components;

    const companyIds = [...new Set(list.map(c => c?.machine?.companyId).filter(Boolean))];

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
            console.error('[ENRICH_COMPONENTS_ERROR]: Failed to fetch company details:', err.message);
        }
    }

    const enriched = list.map(c => {
        const company = c?.machine?.companyId ? companyMap.get(c.machine.companyId) : null;

        const enrichedMachine = c?.machine ? {
            ...c.machine,
            serialNumber: c.machine.serialNumber ? c.machine.serialNumber.replace(/^DEMO-/i, '') : c.machine.serialNumber,
            companyCode: company?.companyCode || null,
            companyName: company?.name || null
        } : null;

        const compName = c.name || (c.description ? c.description.split(" - ")[0].trim() : null);

        return {
            id: c.id,
            name: compName,
            serialNumber: c?.serialNumber ? c.serialNumber.replace(/^DEMO-/i, '') : c?.serialNumber,
            description: c.description || null,
            supplier: c.supplier || null,
            installHours: c.installHours ?? 0,
            currentHours: c.currentHours ?? 0,
            plannedLife: c.plannedLife ?? 0,
            replacementCost: c.replacementCost ? String(c.replacementCost) : "0",
            condition: c.condition ?? 3,
            machineId: c.machineId,
            companyId: c.companyId || (c.machine ? c.machine.companyId : null),
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            machine: enrichedMachine ? {
                id: enrichedMachine.id,
                name: enrichedMachine.name,
                manufacturer: enrichedMachine.manufacturer,
                model: enrichedMachine.model,
                serialNumber: enrichedMachine.serialNumber,
                equipmentType: enrichedMachine.equipmentType,
                companyCode: enrichedMachine.companyCode,
                companyName: enrichedMachine.companyName
            } : null
        };
    });

    return isArray ? enriched : enriched[0];
}

function sanitizeComponentPayload(data) {
    const payload = { ...data };
    if (payload.name) {
        payload.name = payload.name.trim();
    }
    if (payload.description) {
        payload.description = payload.description.trim();
    }
    delete payload.customCategory;
    delete payload.parentComponentId;

    if (!payload.category) {
        payload.category = null;
    }

    return payload;
}

class ComponentRepository {
    async create(data) {
        const payload = sanitizeComponentPayload(data);
        const component = await prisma.component.create({
            data: payload,
            include: {
                machine: true
            }
        });
        return await enrichComponentsWithCompany(component);
    }

    async findAll(companyId, machineId) {
        const where = {};
        if (companyId && companyId !== 'all') {
            where.machine = {
                companyId: companyId
            };
        }
        if (machineId) {
            where.machineId = machineId;
        }

        const components = await prisma.component.findMany({
            where,
            include: {
                machine: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return await enrichComponentsWithCompany(components);
    }

    async findByMachineId(machineId) {
        if (!machineId) return [];

        let targetIds = [machineId];

        try {
            const machine = await prisma.machine.findFirst({
                where: {
                    OR: [
                        { id: machineId },
                        { name: { equals: machineId, mode: 'insensitive' } },
                        { serialNumber: { equals: machineId, mode: 'insensitive' } }
                    ]
                }
            });

            if (machine) {
                targetIds = [...new Set([machine.id, machine.name, machine.serialNumber].filter(Boolean))];
            }
        } catch (e) {
            console.error('[FIND_BY_MACHINE_ID_ERROR]:', e.message);
        }

        const components = await prisma.component.findMany({
            where: {
                machineId: { in: targetIds }
            },
            include: { machine: true },
            orderBy: { createdAt: 'desc' }
        });

        return await enrichComponentsWithCompany(components);
    }

    async findById(id) {
        const component = await prisma.component.findUnique({
            where: { id },
            include: { machine: true }
        });
        return await enrichComponentsWithCompany(component);
    }

    async update(id, data) {
        const payload = sanitizeComponentPayload(data);
        delete payload.machineId; // machineId should not be changed on update
        const component = await prisma.component.update({
            where: { id },
            data: payload,
            include: { machine: true }
        });
        return await enrichComponentsWithCompany(component);
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
        return await prisma.componentCategory.findMany({
            where: whereClause,
            orderBy: { name: 'asc' }
        });
    }

    async createCategory(data) {
        const validCompanyId = await resolveCompanyId(data.companyId);
        const payload = {
            name: data.name,
            description: data.description || null,
            isActive: data.isActive !== undefined ? data.isActive : true,
            companyId: validCompanyId
        };
        return await prisma.componentCategory.create({ data: payload });
    }

    async updateCategory(id, data) {
        return await prisma.componentCategory.update({
            where: { id },
            data
        });
    }

    async deleteCategory(id) {
        return await prisma.componentCategory.delete({
            where: { id }
        });
    }
    async delete(id) {
        return await prisma.component.delete({
            where: { id }
        });
    }
}

module.exports = new ComponentRepository();
