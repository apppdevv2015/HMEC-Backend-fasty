const subscriptionService = require('../services/subscription.service');

class SubscriptionController {
    async getAllPlans(req, res) {
        try {
            const plans = await subscriptionService.getAllPlans();
            res.json(plans);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createPlan(req, res) {
        try {
            const { plan_name, machine_limit, price, features, validity_days } = req.body;
            const plan = await subscriptionService.createPlan({ 
                name: plan_name, 
                machine_limit, 
                price, 
                features,
                validity_days 
            });
            res.status(201).json({ message: 'Plan created successfully', data: plan });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updatePlan(req, res) {
        try {
            const { plan_name, machine_limit, price, features, validity_days } = req.body;
            const dataToUpdate = {};
            if (plan_name) dataToUpdate.name = plan_name;
            if (machine_limit !== undefined) dataToUpdate.machine_limit = machine_limit;
            if (price !== undefined) dataToUpdate.price = price;
            if (features) dataToUpdate.features = features;
            if (validity_days) dataToUpdate.validity_days = validity_days;

            const plan = await subscriptionService.updatePlan(req.params.id, dataToUpdate);
            res.json({ message: 'Plan updated successfully', data: plan });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async deletePlan(req, res) {
        try {
            await subscriptionService.deletePlan(req.params.id);
            res.json({ message: 'Plan deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async checkout(req, res) {
        try {
            const { plan_id } = req.body;
            const checkoutData = await subscriptionService.initiateCheckout(
                req.user.id, 
                plan_id, 
                req.user.company_id,
                req.user.email
            );
            res.json({ message: 'Checkout initiated successfully', ...checkoutData });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async webhook(req, res) {
        try {
            await subscriptionService.handleWebhook(req.body);
            res.sendStatus(200);
        } catch (err) {
            console.error('[PAYFAST WEBHOOK ERROR]', err);
            res.sendStatus(500);
        }
    }
}

module.exports = new SubscriptionController();
