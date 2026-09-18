const prisma = require('../../database/prismaClient');

class AlertRepository {
    async create(data) {
        return await prisma.alert.create({
            data: {
                companyId: data.companyId,
                machineId: data.machineId,
                componentName: data.componentName,
                parameterName: data.parameterName || null,
                previousHealth: data.previousHealth,
                currentHealth: data.currentHealth,
                healthDrop: data.healthDrop,
                status: data.status,
                message: data.message,
                parameterDetails: data.parameterDetails || null
            }
        });
    }

    async findAll({ companyId, machineIds = null, page = 1, limit = 20 }) {
        const whereClause = { companyId };

        if (machineIds && Array.isArray(machineIds)) {
            whereClause.machineId = { in: machineIds };
        }
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const [totalItems, alerts] = await Promise.all([
            prisma.alert.count({ where: whereClause }),
            prisma.alert.findMany({
                where: whereClause,
                include: {
                    machine: {
                        select: { name: true, model: true, serialNumber: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take
            })
        ]);

        return {
            page: Number(page),
            limit: Number(limit),
            totalItems,
            totalPages: Math.ceil(totalItems / limit) || 1,
            data: alerts
        };
    }

    async findById(id) {
        return await prisma.alert.findUnique({
            where: { id },
            include: {
                machine: {
                    select: { name: true, model: true, serialNumber: true, companyId: true }
                }
            }
        });
    }

    async delete(id) {
        return await prisma.alert.delete({
            where: { id }
        });
    }

    async markAsRead(id) {
        return await prisma.alert.update({
            where: { id },
            data: { isRead: true }
        });
    }
}

module.exports = new AlertRepository();