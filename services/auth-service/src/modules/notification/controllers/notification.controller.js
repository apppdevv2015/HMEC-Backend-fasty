const notificationService = require('../services/notification.service');
const responseHandler = require('../../../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

const getNotifications = async (request, reply) => {
    try {
        const user = request.user;
        if (!user?.id) {
            return responseHandler(reply, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
        }

        const limit = request.query.limit ? parseInt(request.query.limit) : 15;

        const list = await notificationService.getNotifications(user, limit);

      const formattedList = list.map(item => ({
    id: item.id,
    title: item.title || item.type || 'Notification',
    message: item.message,
    actorName: item.actor_name || 'System',
    actorRole: item.actor_role || 'System',
    category: item.type,
    type: item.type,
    severity: item.severity || 'info',
    entityType: item.entity_type,
    entityId: item.entity_id,
    timestamp: item.createdAt.toISOString(),
    timeLabel: formatTimeLabel(item.createdAt),
    isRead: item.isRead,
}));

        return responseHandler(reply, HTTP_STATUS.OK, formattedList);
    } catch (error) {
        return responseHandler(reply, HTTP_STATUS.INTERNAL_SERVER_ERROR, error);
    }
};

const markAsRead = async (request, reply) => {
    try {
        const { id } = request.params;
        const user = request.user;
        if (!user?.id) {
            return responseHandler(reply, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
        }

        const result = await notificationService.markAsRead(id, user);
        return responseHandler(reply, HTTP_STATUS.OK, result);
    } catch (error) {
        const status = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
        return responseHandler(reply, status, error.message || error);
    }
};

const markAllAsRead = async (request, reply) => {
    try {
        const user = request.user;
        if (!user?.id) {
            return responseHandler(reply, HTTP_STATUS.UNAUTHORIZED, 'Authentication required');
        }

        await notificationService.markAllAsRead(user);
        return responseHandler(reply, HTTP_STATUS.OK, 'All notifications marked as read');
    } catch (error) {
        return responseHandler(reply, HTTP_STATUS.INTERNAL_SERVER_ERROR, error);
    }
};

function formatTimeLabel(date) {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffMin = Math.round(diffMs / (60 * 1000));
    const diffHr = Math.round(diffMs / (60 * 60 * 1000));

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHr < 24) return `${diffHr} hr ago`;

    return new Date(date).toLocaleDateString();
}

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead
};