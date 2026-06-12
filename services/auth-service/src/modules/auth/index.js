const authController = require('./controllers/auth.controller');
const authRoutes = require('./routes/auth.routes');
const authService = require('./services/auth.service');
const templateService = require('./services/template.service');
const authRepository = require('./repositories/auth.repository');
const activityLogRepository = require('./repositories/activity-log.repository');
const loginValidation = require('./validators/login.validation');
const registerValidation = require('./validators/register.validation');

module.exports = {
    authController,
    authRoutes,
    authService,
    templateService,
    authRepository,
    activityLogRepository,
    validators: {
        loginValidation,
        registerValidation
    }
};
