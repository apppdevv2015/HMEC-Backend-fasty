const notificationService = require('../services/notification.service');
const responseHandler = require('../../../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

const getNotifications = async (request, reply) => {
    try {
        const companyId = request.user?.companyId || request.query.companyId;
        const limit = request.query.limit ? parseInt(request.query.limit) : 15;

        if (!companyId) {
            return responseHandler(reply, HTTP_STATUS.BAD_REQUEST, 'Company ID is required');
        }

        const list = await notificationService.getNotifications(companyId, limit);
        
        // Map list to the format expected by the frontend
        const formattedList = list.map(item => ({
            id: item.id,
            message: item.message,
            timestamp: item.createdAt.toISOString(),
            timeLabel: formatTimeLabel(item.createdAt),
            isRead: item.isRead,
            type: item.type
        }));

        return responseHandler(reply, HTTP_STATUS.OK, formattedList);
    } catch (error) {
        return responseHandler(reply, HTTP_STATUS.INTERNAL_SERVER_ERROR, error);
    }
};

const markAsRead = async (request, reply) => {
    try {
        const { id } = request.params;
        const result = await notificationService.markAsRead(id);
        return responseHandler(reply, HTTP_STATUS.OK, result);
    } catch (error) {
        return responseHandler(reply, HTTP_STATUS.INTERNAL_SERVER_ERROR, error);
    }
};

const markAllAsRead = async (request, reply) => {
    try {
        const companyId = request.user?.companyId || request.body?.companyId || request.query.companyId;
        if (!companyId) {
            return responseHandler(reply, HTTP_STATUS.BAD_REQUEST, 'Company ID is required');
        }
        await notificationService.markAllAsRead(companyId);
        return responseHandler(reply, HTTP_STATUS.OK, 'All notifications marked as read');
    } catch (error) {
        return responseHandler(reply, HTTP_STATUS.INTERNAL_SERVER_ERROR, error);
    }
};

// Helper function to format time label (e.g., '5 min ago', '1 hr ago', 'Just now')
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

