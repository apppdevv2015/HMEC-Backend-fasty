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
        const comps = Array.isArray(m?.components) ? m.components : [];

        return {
            ...m,
            componentsCount: comps.length,
            components: comps,
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
        let actualCompanyId = companyId;
        if (companyId && companyId !== 'all') {
            const resolved = await resolveCompanyId(companyId);
            if (resolved) actualCompanyId = resolved;
        }

        const whereClause = (actualCompanyId && actualCompanyId !== 'all') ? { companyId: actualCompanyId } : {};
        let machines = [];
        try {
            machines = await prisma.machine.findMany({
                where: whereClause,
                include: { 
                    components: true
                },
                orderBy: { createdAt: 'desc' }
            });
        } catch (e) {
            console.error('[FIND_ALL_MACHINES_ERR]:', e.message);
            machines = [];
        }

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
        if (!id) return null;
        let machine = null;
        try {
            machine = await prisma.machine.findFirst({
                where: {
                    OR: [
                        { id: id },
                        { serialNumber: id },
                        { name: id }
                    ]
                },
                include: { components: true }
            });
        } catch (e) {
            console.warn('[FIND_BY_ID_WARN]:', e.message);
        }
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
        if (!id) return null;
        let machine = null;
        try {
            const found = await prisma.machine.findFirst({
                where: {
                    OR: [
                        { id: id },
                        { serialNumber: id },
                        { name: id }
                    ]
                }
            });
            if (found) {
                machine = await prisma.machine.update({
                    where: { id: found.id },
                    data,
                    include: { components: true }
                });
            }
        } catch (e) {
            console.error('[MACHINE_UPDATE_ERR]:', e.message);
        }
        return await enrichMachinesWithCompany(machine);
    }

    async delete(id) {
        return await prisma.machine.delete({
            where: { id }
        });
    }

    async getConditions() {
        try {
            return await prisma.$queryRawUnsafe('SELECT id, rating, name, code, description, color, is_active AS "isActive" FROM "machine_conditions" WHERE "is_active" = true ORDER BY rating ASC;');
        } catch (error) {
            console.error('Failed to fetch machine conditions from DB:', error);
            return [];
        }
    }
}

module.exports = new MachineRepository();
