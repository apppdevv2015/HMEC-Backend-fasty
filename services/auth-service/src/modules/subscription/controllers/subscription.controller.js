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
            const plan = await subscriptionService.createPlan(req.body);
            res.status(201).json(plan);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updatePlan(req, res) {
        try {
            const plan = await subscriptionService.updatePlan(req.params.id, req.body);
            res.json(plan);
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
                req.user.company_id
            );
            res.json(checkoutData);
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
