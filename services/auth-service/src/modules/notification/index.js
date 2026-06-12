const notificationController = require('./controllers/notification.controller');
const notificationRoutes = require('./routes/notification.routes');
const notificationService = require('./services/notification.service');
const notificationRepository = require('./repositories/notification.repository');

module.exports = {
    notificationController,
    notificationRoutes,
    notificationService,
    notificationRepository,
    validators: {}
};
