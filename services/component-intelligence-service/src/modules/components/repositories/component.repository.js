const prisma = require('../../../database/prismaClient');

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
            companyCode: company?.companyCode || null,
            companyName: company?.name || null
        } : null;

        return {
            ...c,
            machine: enrichedMachine
        };
    });

    return isArray ? enriched : enriched[0];
}

class ComponentRepository {
    async create(data) {
        const component = await prisma.component.create({
            data,
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
        const components = await prisma.component.findMany({
            where: { machineId },
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
        const component = await prisma.component.update({
            where: { id },
            data,
            include: { machine: true }
        });
        return await enrichComponentsWithCompany(component);
    }

    async getCategories() {
        return await prisma.componentCategory.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
    }
    async delete(id) {
        return await prisma.component.delete({
            where: { id }
        });
    }
}

module.exports = new ComponentRepository();
