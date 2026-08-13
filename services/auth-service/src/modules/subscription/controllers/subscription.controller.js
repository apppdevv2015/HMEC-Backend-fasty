const subscriptionService = require('../services/subscription.service');
const responseHandler = require('../../../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

class SubscriptionController {
    async getAllPlans(req, res) {
        try {
            let showAll = false;
            const authHeader = req.headers.authorization;
            if (authHeader) {
                try {
                    const jwt = require('jsonwebtoken');
                    const JWT_SECRET = process.env.JWT_SECRET;
                    const token = authHeader.split(' ')[1];
                    const decoded = jwt.verify(token, JWT_SECRET);
                    if (decoded && decoded.role === 'super_admin') {
                        showAll = true;
                    }
                } catch (e) {}
            }

            const plans = await subscriptionService.getAllPlans(!showAll);
            let message = 'Plans fetched successfully';
            if (plans.length === 0) {
                message = showAll 
                    ? 'No plans found. Please create a plan first.' 
                    : 'No active plans are currently available.';
            }
            return responseHandler(res, HTTP_STATUS.OK, message, plans);
        } catch (error) {
            throw error;
        }
    }

    async createPlan(req, res) {
        try {
            const { plan_name, machine_limit, staff_limit, price, features, validity_days, is_public, is_active } = req.body;
            const plan = await subscriptionService.createPlan({ 
                name: plan_name, 
                machineLimit: machine_limit, 
                staffLimit: staff_limit,
                price, 
                features,
                validityDays: validity_days,
                isPublic: is_public ?? true,
                isActive: is_active ?? false
            });
            return responseHandler(res, HTTP_STATUS.CREATED, 'Plan created successfully', plan);
        } catch (error) {
            throw error;
        }
    }

    async updatePlan(req, res) {
        try {
            const { plan_name, machine_limit, staff_limit, price, features, validity_days, is_public, is_active } = req.body;
            const dataToUpdate = {};
            if (plan_name) dataToUpdate.name = plan_name;
            if (machine_limit !== undefined) dataToUpdate.machineLimit = machine_limit;
            if (staff_limit !== undefined) dataToUpdate.staffLimit = staff_limit;
            if (price !== undefined) dataToUpdate.price = price;
            if (features) dataToUpdate.features = features;
            if (validity_days) dataToUpdate.validityDays = validity_days;
            if (is_public !== undefined) dataToUpdate.isPublic = is_public;
            if (is_active !== undefined) dataToUpdate.isActive = is_active;

            const plan = await subscriptionService.updatePlan(req.params.id, dataToUpdate);
            return responseHandler(res, HTTP_STATUS.OK, 'Plan updated successfully', plan);
        } catch (error) {
            throw error;
        }
    }

    async deletePlan(req, res) {
        try {
            await subscriptionService.deletePlan(req.params.id);
            return responseHandler(res, HTTP_STATUS.OK, 'Plan deleted successfully');
        } catch (error) {
            throw error;
        }
    }

    async checkout(req, res) {
        try {
            const { plan_id, idempotency_key } = req.body;
            const checkoutData = await subscriptionService.initiateCheckout(
                req.user.id, 
                plan_id, 
                req.user.companyId,
                req.user.email,
                idempotency_key
            );
            return responseHandler(res, HTTP_STATUS.OK, 'Checkout initiated successfully', checkoutData);
        } catch (error) {
            throw error;
        }
    }

    async webhook(req, res) {
        try {
            await subscriptionService.handleWebhook(req.body);
            res.status(HTTP_STATUS.OK).send();
        } catch (error) {
            console.error('[PAYFAST WEBHOOK ERROR]', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
        }
    }

    async getCompanySubscriptions(req, res) {
        try {
            const subscriptions = await subscriptionService.getCompanySubscriptionHistory(req.user.companyId);
            const message = subscriptions.length > 0 
                ? 'Subscriptions fetched successfully' 
                : 'No subscriptions found for this company.';
            return responseHandler(res, HTTP_STATUS.OK, message, subscriptions);
        } catch (error) {
            throw error;
        }
    }

    async getAllSubscriptions(req, res) {
        try {
            const subscriptions = await subscriptionService.getCompanySubscriptions();
            const message = subscriptions.length > 0 
                ? 'Subscriptions fetched successfully' 
                : 'No subscriptions found in the system.';
            return responseHandler(res, HTTP_STATUS.OK, message, subscriptions);
        } catch (error) {
            throw error;
        }
    }

    async getActiveSubscription(req, res) {
        try {
            const subscription = await subscriptionService.getActiveSubscriptionWithPlan(req.user.companyId);
            const message = subscription 
                ? 'Active subscription fetched successfully' 
                : 'No active subscription found for this company.';
            return responseHandler(res, HTTP_STATUS.OK, message, subscription);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new SubscriptionController();

