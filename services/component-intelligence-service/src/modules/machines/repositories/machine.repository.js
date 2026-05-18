const prisma = require('../../../database/prismaClient');

class MachineRepository {
    async create(data) {
        return await prisma.machine.create({ data });
    }

    async findAll(companyId) {
        return await prisma.machine.findMany({
            where: { companyId },
            include: { components: true }
        });
    }

    async findById(id) {
        return await prisma.machine.findUnique({
            where: { id },
            include: { components: true }
        });
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
        return await prisma.machine.update({
            where: { id },
            data,
            include: { components: true }
        });
    }

    async delete(id) {
        return await prisma.machine.delete({
            where: { id }
        });
    }
}

module.exports = new MachineRepository();
