const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const authRepository = require('../repositories/auth.repository');
const activityLogRepository = require('../repositories/activity-log.repository');
const templateService = require('../services/template.service');

const JWT_SECRET = process.env.JWT_SECRET || 'hme-secret-key-2026';

class AuthService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 587,
            secure: false,
            auth: {
                user: process.env.MAILTRAP_USER,
                pass: process.env.MAILTRAP_PASS
            }
        });
    }

    async login(email, password) {
        // ... (existing login code remains the same)
        const user = await authRepository.findUserByEmail(email);
        if (!user) throw new Error('Invalid email or password');

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) throw new Error('Invalid email or password');

        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role_name, 
                company_id: user.company_id,
                company_code: user.company_code 
            },
            JWT_SECRET,
            { expiresIn: '1825d' }
        );

        // Log Activity
        await activityLogRepository.log({
            userId: user.id,
            companyId: user.company_id,
            action: 'LOGIN',
            module: 'AUTH',
            details: { email: user.email }
        });

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role_name,
                company_code: user.company_code
            }
        };
    }

    async registerCompany(data) {
        const { name, fname, lname, email, password, mobile } = data;

        const companyCode = `HME-${Math.floor(1000 + Math.random() * 9000)}`;

        const [company] = await authRepository.createCompany({
            name,
            company_code: companyCode
        });

        const role = await authRepository.findRoleByName('admin');
        const passwordHash = await bcrypt.hash(password, 10);

        const [user] = await authRepository.createUser({
            first_name: fname,
            last_name: lname,
            email,
            password_hash: passwordHash,
            mobile_number: mobile,
            role_id: role.id,
            company_id: company.id
        });

        // Send Welcome Email to Admin
        await this.sendWelcomeEmail(email, fname, companyCode);

        // Send Notification Email to Super Admin
        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'owner@hme.com';
        await this.sendSuperAdminNotification(superAdminEmail, { name, fname, lname, email, mobile });

        return { user, company_code: companyCode };
    }

    async sendWelcomeEmail(email, name, companyCode) {
        try {
            const html = await templateService.getTemplate('welcome', {
                name,
                companyCode,
                loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000/login'
            });

            const mailOptions = {
                from: '"HME Intelligence" <no-reply@hme.com>',
                to: email,
                subject: 'Welcome to HME Intelligence! 🌍',
                html
            };

            await this.transporter.sendMail(mailOptions);
            console.log('[WELCOME EMAIL SENT]', email);
        } catch (error) {
            console.error('[WELCOME EMAIL ERROR]', error);
        }
    }

    async sendSuperAdminNotification(superAdminEmail, data) {
        try {
            const html = await templateService.getTemplate('admin-alert', {
                companyName: data.name,
                adminName: `${data.fname} ${data.lname}`,
                email: data.email,
                mobile: data.mobile || 'N/A',
                timestamp: new Date().toLocaleString()
            });

            const mailOptions = {
                from: '"HME System Alert" <alerts@hme.com>',
                to: superAdminEmail,
                subject: 'New Company Registered! 🏢',
                html
            };

            await this.transporter.sendMail(mailOptions);
            console.log('[SUPER-ADMIN NOTIFIED]', superAdminEmail);
        } catch (error) {
            console.error('[SUPER-ADMIN NOTIFY ERROR]', error);
        }
    }

    async logout(userId, companyId) {
        return await activityLogRepository.log({
            userId,
            companyId,
            action: 'LOGOUT',
            module: 'AUTH'
        });
    }

    async getActivityLogs(companyId, isSuperAdmin, page, limit) {
        return await activityLogRepository.getLogs(companyId, isSuperAdmin, page, limit);
    }

    async getDashboard(user) {
        const isSuperAdmin = user.role === 'super_admin';
        return await authRepository.getDashboardStats(user.company_id, isSuperAdmin);
    }
}

module.exports = new AuthService();
