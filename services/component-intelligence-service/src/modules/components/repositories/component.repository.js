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
