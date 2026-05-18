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
}

module.exports = new MachineRepository();
