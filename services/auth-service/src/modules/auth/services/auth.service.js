const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepository = require('../repositories/auth.repository');
const prisma = require('../../../database/prisma');
const emailUtils = require('../../../utils/email.utils');
const templateService = require('./template.service');
const { createClient } = require('redis');
const JWT_SECRET = process.env.JWT_SECRET || 'hme-secret-key-2026';

async function publishRedisAlert(channel, payload) {
    const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
    const client = createClient({ 
        url: redisUrl,
        RESP: 2 
    });
    client.on('error', (err) => console.error('[Redis Error]', err));
    try {
        await client.connect();
        await client.publish(channel, JSON.stringify(payload));
        console.log(`[REDIS-PUB] Published alert to ${channel}`);
    } catch (error) {
        console.error('Failed to publish alert to Redis:', error);
    } finally {
        try {
            await client.disconnect();
        } catch (e) {}
    }
}

class AuthService {
    async register(data) {
        // Check if user already exists
        const existingUser = await authRepository.findUserByEmail(data.email);
        if (existingUser) throw new Error('User with this email already exists');

        // Check if company name already exists
        const existingCompany = await prisma.company.findUnique({
            where: { name: data.company_name }
        });
        if (existingCompany) throw new Error('Company name already exists. Please choose a different name.');

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const result = await authRepository.createCompanyWithAdmin({
            ...data,
            password: hashedPassword
        });

        // --- Notification and Alerts on Registration ---
        try {
            // 1. Send welcome email to Admin
            const adminHtml = await templateService.getTemplate('welcome', {
                name: `${result.user.firstName} ${result.user.lastName || ''}`.trim(),
                companyCode: result.company.companyCode,
                plansUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/plans`,
                loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`
            });
            await emailUtils.sendEmail({
                to: result.user.email,
                subject: 'Welcome to HME! Company Registered Successfully 🚀',
                html: adminHtml
            });

            // 2. Send notification to Super Admin
            const superAdmins = await prisma.user.findMany({
                where: { role: { name: 'super_admin' } }
            });
            const superAdminHtml = await templateService.getTemplate('admin-alert', {
                companyName: result.company.name,
                adminName: `${result.user.firstName} ${result.user.lastName || ''}`.trim(),
                email: result.user.email,
                mobile: result.user.mobileNumber || 'N/A',
                timestamp: new Date().toLocaleString()
            });
            for (const sa of superAdmins) {
                await emailUtils.sendEmail({
                    to: sa.email,
                    subject: `🚨 New Company Registered: ${result.company.name}`,
                    html: superAdminHtml
                });
            }

            // 3. Save Notification in DB for Super Admin
            await prisma.notification.create({
                data: {
                    companyId: '00000000-0000-0000-0000-000000000000',
                    message: `🏢 [NEW REGISTRATION] New Company registered: "${result.company.name}" (Admin: ${result.user.firstName} ${result.user.lastName || ''}) is pending approval.`,
                    type: 'system'
                }
            });

            // 4. WebSocket Notification via Redis PubSub
            const alertPayload = {
                id: 'reg-' + Date.now(),
                severity: 'INFO',
                component: 'Registration Manager',
                message: `🏢 [NEW REGISTRATION] New Company registered: "${result.company.name}" (Admin: ${result.user.firstName} ${result.user.lastName || ''}) is pending approval.`,
                timestamp: new Date().toISOString()
            };
            await publishRedisAlert('role:super_admin:alerts', alertPayload);
            await publishRedisAlert('role:sub_super_admin:alerts', alertPayload);
            await publishRedisAlert('alerts:global', alertPayload);
        } catch (err) {
            console.error('[REGISTRATION ALERTS ERROR]', err);
        }

        return result;
    }

    async login(email, password) {
        const user = await authRepository.findUserByEmail(email);
        if (!user) throw new Error('Invalid credentials');

        if (!user.isActive) {
            throw new Error('Your account is inactive. Please wait for Super Admin approval.');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error('Invalid credentials');

        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role.name, 
                companyId: user.companyId,
                name: `${user.firstName} ${user.lastName || ''}`.trim()
            },
            JWT_SECRET,
            { expiresIn: '365000d' }
        );

        return { token };
    }
}

module.exports = new AuthService();
