const subscriptionController = require('./controllers/subscription.controller');
const subscriptionRoutes = require('./routes/subscription.routes');
const subscriptionService = require('./services/subscription.service');
const subscriptionRepository = require('./repositories/subscription.repository');
const planValidation = require('./validators/plan.validation');

module.exports = {
    subscriptionController,
    subscriptionRoutes,
    subscriptionService,
    subscriptionRepository,
    validators: {
        planValidation
    }
};
