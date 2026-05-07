const db = require('../../../database');

class SubscriptionRepository {
    async getAllPlans() {
        return db('subscription_plans').select('*').orderBy('price', 'asc');
    }

    async getPlanById(planId) {
        return db('subscription_plans').where({ id: planId }).first();
    }

    async getSubscriptionById(id) {
        return db('subscriptions').where({ id }).first();
    }

    async getPendingSubscription(companyId, planId) {
        return db('subscriptions')
            .where({ company_id: companyId, plan_id: planId, status: 'pending' })
            .first();
    }

    async createPlan(planData) {
        return db('subscription_plans').insert(planData).returning('*');
    }

    async createSubscription(subscriptionData) {
        return db('subscriptions').insert(subscriptionData).returning('*');
    }

    async updateSubscriptionStatus(id, status) {
        return db('subscriptions').where({ id }).update({ 
            status, 
            updated_at: db.fn.now() 
        });
    }

    async updatePlan(id, planData) {
        return db('subscription_plans').where({ id }).update(planData).returning('*');
    }

    async deletePlan(id) {
        return db('subscription_plans').where({ id }).del();
    }
}

module.exports = new SubscriptionRepository();
