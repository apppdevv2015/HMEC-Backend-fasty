const prisma = require('../../../database/prisma');

class NotificationRepository {
    async createNotification(data) {
        return await prisma.notification.create({
            data: {
                companyId: data.companyId,
                message: data.message,
                type: data.type,
                isRead: false
            }
        });
    }

    async getNotificationsByCompany(companyId, limit = 15) {
        return await prisma.notification.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }

    async markAsRead(id) {
        return await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
    }

    async markAllAsRead(companyId) {
        return await prisma.notification.updateMany({
            where: { companyId, isRead: false },
            data: { isRead: true }
        });
    }
}

module.exports = new NotificationRepository();
