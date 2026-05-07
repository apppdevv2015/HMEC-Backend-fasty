const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const authRepository = require('../repositories/auth.repository');

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
            { expiresIn: '24h' }
        );

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

        // Send Welcome Email
        await this.sendWelcomeEmail(email, fname, companyCode);

        return { user, company_code: companyCode };
    }

    async sendWelcomeEmail(email, name, companyCode) {
        const mailOptions = {
            from: '"HME Intelligence" <no-reply@hme.com>',
            to: email,
            subject: 'Welcome to HME Intelligence! 🌍',
            html: `
                <div style="font-family: 'Outfit', sans-serif; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #00a859;">Welcome to the Team, ${name}!</h2>
                    <p>Your company registration for <b>HME Intelligence</b> is successful.</p>
                    <div style="background: #f4f4f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0;"><b>Your Company Code:</b> <span style="font-size: 1.2rem; color: #00a859;">${companyCode}</span></p>
                        <p style="margin: 5px 0 0 0; font-size: 0.8rem; color: #666;">Keep this code safe, you will need it for login.</p>
                    </div>
                    <p>Next steps: Log in to your dashboard and subscribe to a plan to start monitoring your fleet.</p>
                    <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
                    <p style="font-size: 0.75rem; color: #999;">HME Intelligence South Africa. Helping you make better fleet decisions.</p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('[WELCOME EMAIL SENT]', email);
        } catch (error) {
            console.error('[WELCOME EMAIL ERROR]', error);
        }
    }

    async getDashboard(user) {
        const isSuperAdmin = user.role === 'super_admin';
        return await authRepository.getDashboardStats(user.company_id, isSuperAdmin);
    }
}

module.exports = new AuthService();
