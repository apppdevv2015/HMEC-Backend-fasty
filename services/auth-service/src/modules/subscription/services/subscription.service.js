const nodemailer = require('nodemailer');
const subscriptionRepository = require('../repositories/subscription.repository');
const emailUtils = require('../../../utils/email.utils');
const prisma = require('../../../database/prisma');
const templateService = require('../../auth/services/template.service');

class SubscriptionService {
    constructor() {}

    async getAllPlans(onlyPublic = false) {
        return subscriptionRepository.getAllPlans(onlyPublic);
    }

    async getActiveSubscriptionWithPlan(companyId) {
        return subscriptionRepository.getActiveSubscriptionWithPlan(companyId);
    }



    async createPlan(planData) {
        return subscriptionRepository.createPlan(planData);
    }

    async updatePlan(id, planData) {
        return subscriptionRepository.updatePlan(id, planData);
    }

    async deletePlan(id) {
        return subscriptionRepository.deletePlan(id);
    }

    async initiateCheckout(userId, planId, companyId, userEmail, idempotencyKey) {
        const plan = await subscriptionRepository.getPlanById(planId);
        if (!plan) throw new Error('Plan not found');

        // --- Demo Plan Misuse Prevention ---
        if (Number(plan.price) === 0) {
            const history = await subscriptionRepository.getCompanySubscriptionHistory(companyId);
            const hasHadDemo = history.some(sub => Number(sub.plan.price) === 0);
            
            if (hasHadDemo) {
                throw new Error('DEMO_ALREADY_USED: Your company has already used a demo plan. Please upgrade to a paid plan.');
            }
        }

        const merchantId = process.env.PAYFAST_MERCHANT_ID || '10004002';
        const merchantKey = process.env.PAYFAST_MERCHANT_KEY || 'q1cd2rdny4a53';
        
        let subscription = null;
        if (idempotencyKey) {
            subscription = await prisma.subscription.findFirst({
                where: { idempotencyKey }
            });
        }

        if (!subscription) {
            const validityDays = plan.validityDays || 30;
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + validityDays);

            subscription = await subscriptionRepository.createSubscription({
                companyId: companyId,
                userId: userId,
                planId: planId,
                status: 'pending',
                subscriptionEndDate: endDate,
                idempotencyKey: idempotencyKey
            });
        }

        // Handle Free Plans 
        if (Number(plan.price) === 0) {
            if (subscription.status === 'active') {
                return { message: 'Plan already active', skip_payment: true, subscription_id: subscription.id };
            }

            const validityDays = plan.validityDays || 14;
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + validityDays);

            await this.activateSubscription(subscription.id, endDate, 'COMPLETE');

            await this.sendSubscriptionNotifications(userEmail || 'admin@example.com', companyId, plan.planName, 0, endDate.toLocaleDateString(), true);

            return {
                message: 'Free plan activated successfully',
                skip_payment: true,
                subscription_id: subscription.id
            };
        }

        const paymentData = {
            merchant_id: merchantId,
            merchant_key: merchantKey,
            amount: Number(plan.price).toFixed(2),
            item_name: `HME Plan: ${plan.planName}`,
            m_payment_id: subscription.id,
            return_url: process.env.FRONTEND_URL || `http://localhost:5173/company-admin/dashboard`,
            cancel_url: process.env.FRONTEND_URL || `http://localhost:5173/cart`,
            notify_url: process.env.PAYFAST_NOTIFY_URL || `http://localhost:4000/api/v1/plans/webhook`,
        };

        return {
            message: 'Checkout initiated successfully',
            payment_url: process.env.PAYFAST_URL || 'https://sandbox.payfast.co.za/eng/process',
            data: paymentData,
            subscription_id: subscription.id
        };
    }

    async handleWebhook(data) {
        const { m_payment_id, payment_status, item_name, amount_gross, email_address } = data;
        
        if (!m_payment_id) return { success: false, error: 'Missing m_payment_id' };

        const existingSub = await subscriptionRepository.getSubscriptionById(m_payment_id);
        if (existingSub && existingSub.status === 'active') return { success: true };

        if (payment_status === 'COMPLETE') {
            const plan = await subscriptionRepository.getPlanById(existingSub.planId);
            const validityDays = plan ? plan.validityDays : 30;
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + validityDays);

            await this.activateSubscription(m_payment_id, endDate, 'COMPLETE');
            
            const updatedSub = await subscriptionRepository.getSubscriptionById(m_payment_id);
            const expiryDate = updatedSub.subscriptionEndDate ? new Date(updatedSub.subscriptionEndDate).toLocaleDateString() : 'N/A';

            await this.sendSubscriptionNotifications(email_address || existingSub.user?.email || 'admin@example.com', existingSub.companyId, item_name, amount_gross, expiryDate, false);
        }
        return { success: true };
    }

    async activateSubscription(subscriptionId, endDate, paymentStatus) {
        const subscription = await subscriptionRepository.getSubscriptionById(subscriptionId);
        if (!subscription) throw new Error('Subscription not found');

        await subscriptionRepository.activateSubscription(subscriptionId, endDate, paymentStatus);
    }

    async getCompanySubscriptionHistory(companyId) {
        return subscriptionRepository.getCompanySubscriptionHistory(companyId);
    }

    async getCompanySubscriptions() {
        return subscriptionRepository.getAllSubscriptions();
    }

    async sendSubscriptionNotifications(userEmail, companyId, planName, amount, expiryDate, isDemo = false) {
        const timestamp = new Date().toLocaleString();
        const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        try {
            const company = await prisma.company.findUnique({ where: { id: companyId } });
            const companyName = company ? company.name : 'Your Company';

            // 1. Notify the User (Company Admin)
            const adminHtml = await templateService.getTemplate('subscription-confirmation', {
                name: companyName,
                planName: planName,
                amount: amount,
                expiryDate: expiryDate || 'N/A', 
                dashboardUrl: dashboardUrl
            });

            await emailUtils.sendEmail({
                to: userEmail,
                subject: isDemo ? 'Demo Plan Activated! 🛠️' : 'Subscription Activated! 🚀',
                html: adminHtml
            });

            // 2. Notify the System Owner (Super Admin)
            const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@hme.com';

            const alertHtml = await templateService.getTemplate('subscription-alert', {
                companyName: companyName,
                adminName: 'Company Admin',
                planName: planName,
                type: isDemo ? 'DEMO' : 'PAID',
                amount: amount,
                timestamp: timestamp
            });

            await emailUtils.sendEmail({
                to: superAdminEmail,
                subject: isDemo ? '🛠️ New Demo Activation' : '💰 Revenue Alert: Subscription Payment!',
                html: alertHtml
            });

        } catch (err) { 
            console.error('[SUBSCRIPTION NOTIFICATION ERROR]', err); 
        }
    }
}

module.exports = new SubscriptionService();
