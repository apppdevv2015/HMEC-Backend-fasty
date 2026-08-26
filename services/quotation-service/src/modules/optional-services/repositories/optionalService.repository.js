const prisma = require('../../../config/database');

class OptionalServiceRepository {
    async findAll(filter = {}) {
        const where = {};
        if (filter.isActive !== undefined) {
            where.isActive = filter.isActive;
        }
        if (filter.search) {
            where.OR = [
                { name: { contains: filter.search, mode: 'insensitive' } },
                { description: { contains: filter.search, mode: 'insensitive' } }
            ];
        }

        return prisma.optionalServiceCatalog.findMany({
            where,
            orderBy: [
                { sortOrder: 'asc' },
                { createdAt: 'desc' }
            ]
        });
    }

    async findById(id) {
        return prisma.optionalServiceCatalog.findUnique({
            where: { id }
        });
    }

    async findByName(name) {
        return prisma.optionalServiceCatalog.findFirst({
            where: {
                name: { equals: name.trim(), mode: 'insensitive' }
            }
        });
    }

    async create(data) {
        return prisma.optionalServiceCatalog.create({
            data: {
                name: data.name,
                description: data.description || null,
                isActive: data.isActive !== undefined ? Boolean(data.isActive) : false,
                sortOrder: Number(data.sortOrder) || 0,
                createdBy: data.createdBy || null
            }
        });
    }

    async update(id, data) {
        const updatePayload = {};
        if (data.name !== undefined) updatePayload.name = data.name;
        if (data.description !== undefined) updatePayload.description = data.description;
        if (data.isActive !== undefined) updatePayload.isActive = Boolean(data.isActive);
        if (data.sortOrder !== undefined) updatePayload.sortOrder = Number(data.sortOrder);

        return prisma.optionalServiceCatalog.update({
            where: { id },
            data: updatePayload
        });
    }

    async toggleActive(id) {
        const item = await this.findById(id);
        if (!item) throw new Error('Service not found');
        return prisma.optionalServiceCatalog.update({
            where: { id },
            data: { isActive: !item.isActive }
        });
    }

    async delete(id) {
        return prisma.optionalServiceCatalog.delete({
            where: { id }
        });
    }
}

module.exports = new OptionalServiceRepository();
