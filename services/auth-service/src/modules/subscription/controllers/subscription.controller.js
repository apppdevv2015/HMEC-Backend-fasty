const subscriptionService = require('../services/subscription.service');
const responseHandler = require('../../../utils/responseHandler');

class SubscriptionController {
    async getAllPlans(req, res) {
        try {
            let showAll = false;
            const authHeader = req.headers.authorization;
            if (authHeader) {
                try {
                    const jwt = require('jsonwebtoken');
                    const JWT_SECRET = process.env.JWT_SECRET || 'hme-secret-key-2026';
                    const token = authHeader.split(' ')[1];
                    const decoded = jwt.verify(token, JWT_SECRET);
                    if (decoded && decoded.role === 'super_admin') {
                        showAll = true;
                    }
                } catch (e) {}
            }

            const plans = await subscriptionService.getAllPlans(!showAll);
            return responseHandler(res, 200, 'Plans fetched successfully', plans);
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
            return responseHandler(res, 201, 'Plan created successfully', plan);
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
            return responseHandler(res, 200, 'Plan updated successfully', plan);
        } catch (error) {
            throw error;
        }
    }

    async deletePlan(req, res) {
        try {
            await subscriptionService.deletePlan(req.params.id);
            return responseHandler(res, 200, 'Plan deleted successfully');
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
            return responseHandler(res, 200, 'Checkout initiated successfully', checkoutData);
        } catch (error) {
            throw error;
        }
    }

    async webhook(req, res) {
        try {
            await subscriptionService.handleWebhook(req.body);
            res.status(200).send();
        } catch (error) {
            console.error('[PAYFAST WEBHOOK ERROR]', error);
            res.status(500).send();
        }
    }

    async getCompanySubscriptions(req, res) {
        try {
            const subscriptions = await subscriptionService.getCompanySubscriptionHistory(req.user.companyId);
            return responseHandler(res, 200, 'Subscriptions fetched successfully', subscriptions);
        } catch (error) {
            throw error;
        }
    }

    async getActiveSubscription(req, res) {
        try {
            const subscription = await subscriptionService.getActiveSubscriptionWithPlan(req.user.companyId);
            return responseHandler(res, 200, 'Active subscription fetched successfully', subscription);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new SubscriptionController();

