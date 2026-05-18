const prisma = require('../../../database/prismaClient');

class ComponentRepository {
    async create(data) {
        return await prisma.component.create({
            data,
            include: {
                machine: true
            }
        });
    }

    async findAll(companyId) {
        return await prisma.component.findMany({
            where: {
                machine: {
                    companyId: companyId
                }
            },
            include: {
                machine: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async findById(id) {
        return await prisma.component.findUnique({
            where: { id },
            include: { machine: true }
        });
    }

    async update(id, data) {
        return await prisma.component.update({
            where: { id },
            data,
            include: { machine: true }
        });
    }
}

module.exports = new ComponentRepository();
