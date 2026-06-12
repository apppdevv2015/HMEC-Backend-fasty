const notificationService = require('../services/notification.service');

const getNotifications = async (request, reply) => {
    try {
        const companyId = request.user?.companyId || request.query.companyId;
        const limit = request.query.limit ? parseInt(request.query.limit) : 15;

        if (!companyId) {
            return reply.code(400).send({
                success: false,
                message: 'Company ID is required',
                error: 'Bad Request'
            });
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

        return reply.code(200).send({
            success: true,
            data: formattedList,
            error: null
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
            error: 'Internal Server Error'
        });
    }
};

const markAsRead = async (request, reply) => {
    try {
        const { id } = request.params;
        const result = await notificationService.markAsRead(id);
        return reply.code(200).send({
            success: true,
            data: result,
            error: null
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
            error: 'Internal Server Error'
        });
    }
};

const markAllAsRead = async (request, reply) => {
    try {
        const companyId = request.user?.companyId || request.body?.companyId || request.query.companyId;
        if (!companyId) {
            return reply.code(400).send({
                success: false,
                message: 'Company ID is required',
                error: 'Bad Request'
            });
        }
        await notificationService.markAllAsRead(companyId);
        return reply.code(200).send({
            success: true,
            message: 'All notifications marked as read',
            error: null
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
            error: 'Internal Server Error'
        });
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
