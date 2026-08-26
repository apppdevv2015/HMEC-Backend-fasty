const prisma = require('../../../config/database');

class OptionalServiceRepository {
    async findAll(filter = {}) {
        const where = {};
        if (filter.isActive !== undefined) {
            where.isActive = filter.isActive;
        }
        if (filter.category) {
            where.category = { equals: filter.category, mode: 'insensitive' };
        }
        if (filter.search) {
            where.OR = [
                { name: { contains: filter.search, mode: 'insensitive' } },
                { code: { contains: filter.search, mode: 'insensitive' } },
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

    async findByCode(code) {
        return prisma.optionalServiceCatalog.findUnique({
            where: { code }
        });
    }

    async create(data) {
        return prisma.optionalServiceCatalog.create({
            data: {
                code: data.code,
                name: data.name,
                category: data.category ,
                description: data.description || null,
                pricingType: data.pricingType,
                defaultPrice: Number(data.defaultPrice) || 0,
                unit: data.unit,
                features: data.features || [],
                isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
                sortOrder: Number(data.sortOrder) || 0,
                createdBy: data.createdBy || null
            }
        });
    }

    async update(id, data) {
        const updatePayload = {};
        if (data.name !== undefined) updatePayload.name = data.name;
        if (data.category !== undefined) updatePayload.category = data.category;
        if (data.description !== undefined) updatePayload.description = data.description;
        if (data.pricingType !== undefined) updatePayload.pricingType = data.pricingType;
        if (data.defaultPrice !== undefined) updatePayload.defaultPrice = Number(data.defaultPrice);
        if (data.unit !== undefined) updatePayload.unit = data.unit;
        if (data.features !== undefined) updatePayload.features = data.features;
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
