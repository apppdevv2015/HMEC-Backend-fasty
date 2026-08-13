const prisma = require('../../../database/prismaClient');

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
        return {
            ...m,
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
