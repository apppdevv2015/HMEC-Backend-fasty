const prisma = require('../../../database/prismaClient');

class MaintenanceService {
    async createLog(data) {
        return await prisma.maintenanceLog.create({
            data: {
                companyId: data.companyId,
                machineId: data.machineId,
                componentId: data.componentId || null,
                technician: data.technician,
                date: data.date ? new Date(data.date) : new Date(),
                work: data.work,
                cost: data.cost || 0,
                downtime: data.downtime || '0 hrs',
                status: data.status || 'Open'
            },
            include: {
                machine: true,
                component: true
            }
        });
    }

    async getLogs(companyId) {
        return await prisma.maintenanceLog.findMany({
            where: { companyId },
            include: {
                machine: true,
                component: true
            },
            orderBy: {
                date: 'desc'
            }
        });
    }

    async updateLog(id, data) {
        const updateData = {};
        if (data.machineId !== undefined) updateData.machineId = data.machineId;
        if (data.componentId !== undefined) updateData.componentId = data.componentId || null;
        if (data.technician !== undefined) updateData.technician = data.technician;
        if (data.date !== undefined) updateData.date = new Date(data.date);
        if (data.work !== undefined) updateData.work = data.work;
        if (data.cost !== undefined) updateData.cost = data.cost;
        if (data.downtime !== undefined) updateData.downtime = data.downtime;
        if (data.status !== undefined) updateData.status = data.status;

        return await prisma.maintenanceLog.update({
            where: { id },
            data: updateData,
            include: {
                machine: true,
                component: true
            }
        });
    }

    async deleteLog(id) {
        return await prisma.maintenanceLog.delete({
            where: { id }
        });
    }
}

module.exports = new MaintenanceService();
