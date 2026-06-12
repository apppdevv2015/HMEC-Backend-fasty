const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');

async function notificationRoutes(fastify, options) {
    // Expose dynamic HME notification API endpoints
    fastify.get('/', { preHandler: authMiddleware }, notificationController.getNotifications);
    fastify.put('/:id/read', { preHandler: authMiddleware }, notificationController.markAsRead);
    fastify.put('/read-all', { preHandler: authMiddleware }, notificationController.markAllAsRead);
}

module.exports = notificationRoutes;
