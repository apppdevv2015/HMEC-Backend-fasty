const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepository = require('../repositories/auth.repository');
const prisma = require('../../../database/prisma');
const emailUtils = require('../../../utils/email.utils');
const templateService = require('./template.service');
const { createClient } = require('redis');
const JWT_SECRET = process.env.JWT_SECRET;

async function publishRedisAlert(channel, payload) {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    const client = createClient({ 
        url: redisUrl,
        RESP: 2,
        socket: {
            connectTimeout: 2000,
            reconnectStrategy: false
        }
    });
    client.on('error', (err) => console.error('[Redis Error]', err.message || err));
    try {
        await client.connect();
        await client.publish(channel, JSON.stringify(payload));
        console.log(`[REDIS-PUB] Published alert to ${channel}`);
    } catch (error) {
        console.error('Failed to publish alert to Redis:', error.message || error);
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

        // --- Notification and Alerts on Registration (Asynchronous / Non-Blocking) ---
        setImmediate(async () => {
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
        });

        return result;
    }

    async login(email, password) {
        const user = await authRepository.findUserByEmail(email);
        if (!user) throw new Error('Invalid credentials');

        if (!user.isActive) {
            throw new Error('Your account is inactive. Please wait for Super Admin approval.');
        }

        if (user.role && user.role.isActive === false) {
            throw new Error('Your assigned role is currently inactive. Please wait for Super Admin approval.');
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

        await authRepository.updateUserLastLogin(user.id);

        return { token };
    }

    async forgotPassword(email) {
        if (!email) throw new Error('Email address is required.');

        const user = await authRepository.findUserByEmail(email.trim().toLowerCase());
        if (!user) {
            throw new Error('No account found with this email address.');
        }

        // Generate 6-digit OTP code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Generate secure 15-minute JWT reset token
        const resetToken = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                otp, 
                type: 'password_reset' 
            },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Store OTP in cache
        if (!global.resetOtpStore) {
            global.resetOtpStore = new Map();
        }
        global.resetOtpStore.set(user.email.toLowerCase(), {
            otp,
            userId: user.id,
            expiresAt: Date.now() + 15 * 60 * 1000
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

        // Send Email asynchronously
        setImmediate(async () => {
            try {
                const html = await templateService.getTemplate('reset-password', {
                    name: `${user.firstName} ${user.lastName || ''}`.trim(),
                    email: user.email,
                    otp,
                    resetUrl
                });

                await emailUtils.sendEmail({
                    to: user.email,
                    subject: '🔐 Reset Your HME Account Password',
                    html
                });
                console.log(`[PASSWORD_RESET] Email sent successfully to ${user.email}`);
            } catch (err) {
                console.error('[PASSWORD_RESET_EMAIL_ERROR]', err.message || err);
            }
        });

        return {
            message: 'Password reset instructions and verification code have been sent to your email.',
            email: user.email,
            token: resetToken,
            otp: otp
        };
    }

    async verifyResetToken({ token, email, otp }) {
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                if (decoded.type !== 'password_reset') {
                    throw new Error('Invalid token type');
                }
                return { valid: true, email: decoded.email };
            } catch (err) {
                throw new Error('Reset link has expired or is invalid. Please request a new one.');
            }
        }

        if (email && otp) {
            const cached = global.resetOtpStore?.get(email.toLowerCase());
            if (!cached || cached.otp !== otp || Date.now() > cached.expiresAt) {
                throw new Error('Invalid or expired verification code.');
            }
            return { valid: true, email };
        }

        throw new Error('Please provide either a reset token or email with OTP.');
    }

    async resetPassword({ token, email, otp, newPassword }) {
        if (!newPassword || newPassword.length < 6) {
            throw new Error('Password must be at least 6 characters long.');
        }

        let userId = null;
        let userEmail = null;

        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                if (decoded.type !== 'password_reset') {
                    throw new Error('Invalid reset token.');
                }
                userId = decoded.id;
                userEmail = decoded.email;
            } catch (err) {
                throw new Error('Reset link has expired or is invalid. Please request a new one.');
            }
        } else if (email && otp) {
            const cached = global.resetOtpStore?.get(email.toLowerCase());
            if (!cached || cached.otp !== otp || Date.now() > cached.expiresAt) {
                throw new Error('Invalid or expired verification code.');
            }
            userId = cached.userId;
            userEmail = email.toLowerCase();
        } else {
            throw new Error('Reset token or email with OTP is required.');
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) throw new Error('User not found.');

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await authRepository.updateUserPassword(userId, hashedPassword);

        if (global.resetOtpStore && userEmail) {
            global.resetOtpStore.delete(userEmail.toLowerCase());
        }

        return {
            message: 'Password has been reset successfully! You can now log in.'
        };
    }
}

module.exports = new AuthService();
