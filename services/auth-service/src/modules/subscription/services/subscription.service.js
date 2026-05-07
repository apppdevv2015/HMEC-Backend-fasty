const nodemailer = require('nodemailer');
const subscriptionRepository = require('../repositories/subscription.repository');

class SubscriptionService {
    constructor() {
        // Debugging logs to verify credentials inside container
        console.log('[DEBUG-EMAIL] User:', process.env.MAILTRAP_USER);
        
        this.transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.MAILTRAP_USER,
                pass: process.env.MAILTRAP_PASS
            }
        });
    }

    async getAllPlans() {
        return subscriptionRepository.getAllPlans();
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

    async initiateCheckout(userId, planId, companyId) {
        const plan = await subscriptionRepository.getPlanById(planId);
        if (!plan) throw new Error('Plan not found');

        const merchantId = process.env.PAYFAST_MERCHANT_ID || '10004002';
        const merchantKey = process.env.PAYFAST_MERCHANT_KEY || 'q1cd2rdny4a53';
        
        // Idempotency: Check if a pending subscription already exists for this company and plan
        let subscription = await subscriptionRepository.getPendingSubscription(companyId, planId);

        if (!subscription) {
            const [newSub] = await subscriptionRepository.createSubscription({
                company_id: companyId,
                plan_id: planId,
                status: 'pending',
                start_date: new Date(),
                end_date: new Date(new Date().setMonth(new Date().getMonth() + 1))
            });
            subscription = newSub;
        } else {
            // Update the existing pending subscription's timestamp
            await subscriptionRepository.updateSubscriptionStatus(subscription.id, 'pending');
        }

        const paymentData = {
            merchant_id: merchantId,
            merchant_key: merchantKey,
            amount: Number(plan.price).toFixed(2),
            item_name: `HME Plan: ${plan.name}`,
            m_payment_id: subscription.id,
            return_url: process.env.PAYFAST_RETURN_URL || `http://localhost:3000/payment/success`,
            cancel_url: process.env.PAYFAST_CANCEL_URL || `http://localhost:3000/payment/cancel`,
            notify_url: process.env.PAYFAST_NOTIFY_URL || `http://localhost:4000/api/auth/subscriptions/webhook`,
        };

        return {
            payment_url: process.env.PAYFAST_URL || 'https://sandbox.payfast.co.za/eng/process',
            data: paymentData,
            subscription_id: subscription.id
        };
    }

    async handleWebhook(data) {
        const { m_payment_id, payment_status, item_name, amount_gross, email_address } = data;
        
        const existingSub = await subscriptionRepository.getSubscriptionById(m_payment_id);
        if (existingSub && existingSub.status === 'active') {
            return { success: true };
        }

        if (payment_status === 'COMPLETE') {
            await subscriptionRepository.updateSubscriptionStatus(m_payment_id, 'active');
            // Added await here to ensure we catch errors
            await this.sendConfirmationEmail(email_address || 'admin@example.com', item_name, amount_gross);
        }
        return { success: true };
    }

    async sendConfirmationEmail(userEmail, planName, amount) {
        const mailOptions = {
            from: '"HME Intelligence" <no-reply@hme.com>',
            to: userEmail,
            subject: 'Subscription Activated! 🚀',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #eee;">
                    <h2 style="color: #2e7d32;">Welcome to HME Premium!</h2>
                    <p>Your payment for <b>${planName}</b> was successful.</p>
                    <p><b>Amount:</b> R ${amount}</p>
                    <p>Your dashboard is now upgraded. Please log in to your account to see the changes.</p>
                </div>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('[EMAIL SENT SUCCESS]', info.messageId);
        } catch (error) {
            console.error('[EMAIL ERROR]', error);
            throw error; // Throw so we can see it in logs/response
        }
    }
}

module.exports = new SubscriptionService();
