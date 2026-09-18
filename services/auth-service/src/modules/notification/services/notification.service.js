const notificationRepository = require('../repositories/notification.repository');
const { normalizeRoleForStorage, isSuperAdminRole } = require('../../../../../../shared/notifications/notificationPublisher');

class NotificationService {
    async createNotification(data) {
        return await notificationRepository.createNotification(data);
    }

    async getNotifications(user, limit) {
        if (!user?.id) throw new Error('Authenticated user is required');

        return await notificationRepository.getNotificationsForUser({
            userId: user.id,
            companyId: user.companyId || null,
            role: normalizeRoleForStorage(user.role || user.roleName),
            isSuperAdmin: isSuperAdminRole(user.role || user.roleName)
        }, limit);
    }

    async markAsRead(id, user) {
        if (!id) throw new Error('Notification ID is required');

        const notification = await notificationRepository.findById(id);
        if (!notification) {
            const err = new Error('Notification not found');
            err.statusCode = 404;
            throw err;
        }

        // FIXED: was notification.user_id (Prisma field is userId, always undefined before).
        // Also fixed: role-broadcast match no longer requires isSuperAdmin — any user in the
        // matching company+role can mark their own broadcast notification as read, same
        // scoping rule the repository's _buildScopeConditions uses.
        const owns =
            notification.userId === user.id ||
            (notification.role === 'SUPER_ADMIN' && isSuperAdminRole(user.role || user.roleName)) ||
            (!notification.userId &&
                notification.companyId === user.companyId &&
                notification.role === normalizeRoleForStorage(user.role || user.roleName));

        if (!owns) {
            const err = new Error('Unauthorized to modify this notification');
            err.statusCode = 403;
            throw err;
        }

        return await notificationRepository.markAsRead(id);
    }

    async markAllAsRead(user) {
        if (!user?.id) throw new Error('Authenticated user is required');

        return await notificationRepository.markAllAsReadForUser({
            userId: user.id,
            companyId: user.companyId || null,
            role: normalizeRoleForStorage(user.role || user.roleName),
            isSuperAdmin: isSuperAdminRole(user.role || user.roleName)
        });
    }
}

module.exports = new NotificationService();