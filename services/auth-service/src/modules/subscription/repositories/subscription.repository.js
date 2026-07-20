const prisma = require('../../../database/prisma');

class SubscriptionRepository {
    async getAllPlans(onlyPublic = false) {
        return await prisma.subscriptionPlan.findMany({
            where: onlyPublic ? { isPublic: true, isActive: true } : {},
            orderBy: { price: 'asc' }
        });
    }

    async getPlanById(planId) {
        return await prisma.subscriptionPlan.findUnique({
            where: { id: planId }
        });
    }

    async getPlanByName(planName) {
        return await prisma.subscriptionPlan.findUnique({
            where: { planName }
        });
    }


    async getActiveSubscription(companyId) {
        return await prisma.subscription.findFirst({
            where: {
                companyId: companyId,
                status: 'active',
                subscriptionEndDate: {
                    gt: new Date()
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                plan: true
            }
        });
    }

    async getSubscriptionById(id) {
        return await prisma.subscription.findUnique({
            where: { id }
        });
    }

    async getActiveSubscriptionWithPlan(companyId) {
        return await prisma.subscription.findFirst({
            where: {
                companyId: companyId,
                status: 'active',
                subscriptionEndDate: {
                    gt: new Date()
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                plan: true
            }
        });
    }

    async createPlan(planData) {
        return await prisma.subscriptionPlan.create({
            data: {
                planName: planData.name,
                price: parseFloat(planData.price),
                machineLimit: parseInt(planData.machineLimit),
                staffLimit: parseInt(planData.staffLimit),
                validityDays: parseInt(planData.validityDays),
                isPublic: planData.isPublic ?? true,
                isActive: planData.isActive ?? true
            }
        });
    }

    async createSubscription(subscriptionData) {
        return await prisma.subscription.create({
            data: {
                companyId: subscriptionData.companyId,
                userId: subscriptionData.userId,
                planId: subscriptionData.planId,
                status: subscriptionData.status || 'pending',
                paymentStatus: subscriptionData.paymentStatus || 'PENDING',
                idempotencyKey: subscriptionData.idempotencyKey,
                subscriptionStartDate: new Date(),
                subscriptionEndDate: subscriptionData.subscriptionEndDate
            }
        });
    }

    async updateSubscriptionStatus(id, status) {
        return await prisma.subscription.update({
            where: { id },
            data: { status }
        });
    }

    async activateSubscription(id, endDate, paymentStatus = 'COMPLETE') {
        const sub = await this.getSubscriptionById(id);
        if (sub) {
            // Expire any other active subscriptions for this company
            await prisma.subscription.updateMany({
                where: { 
                    companyId: sub.companyId, 
                    status: 'active',
                    NOT: { id }
                },
                data: { status: 'expired' }
            });
        }

        return await prisma.subscription.update({
            where: { id },
            data: {
                status: 'active',
                paymentStatus,
                subscriptionEndDate: endDate
            }
        });
    }

    async updatePlan(id, planData) {
        return await prisma.subscriptionPlan.update({
            where: { id },
            data: planData
        });
    }

    async deletePlan(id) {
        return await prisma.subscriptionPlan.delete({
            where: { id }
        });
    }

    async deactivateAllActiveSubscriptions(companyId, exceptSubscriptionId) {
        return await prisma.subscription.updateMany({
            where: {
                companyId: companyId,
                status: 'active',
                id: { not: exceptSubscriptionId }
            },
            data: {
                status: 'expired'
            }
        });
    }

    async getCompanySubscriptionHistory(companyId) {
        if (!companyId) return [];
        return await prisma.subscription.findMany({
            where: { companyId },
            include: { plan: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getAllSubscriptions() {
        return await prisma.subscription.findMany({
            include: {
                company: true,
                plan: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}

module.exports = new SubscriptionRepository();
