const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const userRepository = require('../repositories/user.repository');
const roleRepository = require('../../role/repositories/role.repository');
const activityLogRepository = require('../../auth/repositories/activity-log.repository');
const templateService = require('../../auth/services/template.service');

class UserService {
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

    async getUsers(companyId, isSuperAdmin, page, limit, search, filters) {
        return await userRepository.getAllUsers(companyId, isSuperAdmin, page, limit, search, filters);
    }

    async getUser(id) {
        return await userRepository.getUserById(id);
    }

    async createUser(data, adminCompanyId, isSuperAdmin) {
        const { first_name, last_name, email, password, mobile_number, role_name, company_id } = data;

        const role = await roleRepository.findByName(role_name);
        if (!role) throw new Error('Invalid role name');

        const tempPassword = Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        
        // Ensure non-superadmins can only create users in their own company
        const targetCompanyId = isSuperAdmin ? (company_id || adminCompanyId) : adminCompanyId;

        const [user] = await userRepository.createUser({
            first_name,
            last_name,
            email,
            password_hash: passwordHash,
            mobile_number: data.mobile_number,
            role_id: role.id,
            company_id: targetCompanyId
        });

        // Send Staff Welcome Email
        await this.sendStaffWelcomeEmail(email, first_name, role_name, tempPassword);

        // Log Activity
        await activityLogRepository.log({
            userId: null, 
            companyId: targetCompanyId,
            action: 'CREATE_USER',
            module: 'USER',
            details: { newUser: email, role: role_name }
        });

        return user;
    }

    async updateUser(id, data) {
        if (data.password) {
            data.password_hash = await bcrypt.hash(data.password, 10);
            delete data.password;
        }

        if (data.role_name) {
            const role = await roleRepository.findByName(data.role_name);
            if (role) {
                data.role_id = role.id;
            }
            delete data.role_name;
        }

        return await userRepository.updateUser(id, data);
    }

    async deleteUser(id) {
        return await userRepository.deleteUser(id);
    }

    async sendStaffWelcomeEmail(email, name, role, plainPassword) {
        try {
            const html = await templateService.getTemplate('staff-welcome', {
                name,
                role: role.toUpperCase(),
                email,
                password: plainPassword
            });

            const mailOptions = {
                from: '"HME Intelligence" <no-reply@hme.com>',
                to: email,
                subject: 'Welcome to HME Intelligence Team! 👷‍♂️',
                html
            };

            await this.transporter.sendMail(mailOptions);
            console.log('[STAFF EMAIL SENT]', email);
        } catch (error) {
            console.error('[STAFF EMAIL ERROR]', error);
        }
    }
}

module.exports = new UserService();
