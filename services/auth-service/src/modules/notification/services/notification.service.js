const notificationRepository = require('../repositories/notification.repository');

class NotificationService {
    async createNotification(data) {
        return await notificationRepository.createNotification(data);
    }

    async getNotifications(companyId, limit) {
        if (!companyId) throw new Error('Company ID is required');
        return await notificationRepository.getNotificationsByCompany(companyId, limit);
    }

    async markAsRead(id) {
        if (!id) throw new Error('Notification ID is required');
        return await notificationRepository.markAsRead(id);
    }

    async markAllAsRead(companyId) {
        if (!companyId) throw new Error('Company ID is required');
        return await notificationRepository.markAllAsRead(companyId);
    }
}

module.exports = new NotificationService();
