const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const roleRepository = require('../../role/repositories/role.repository');
const templateService = require('../../auth/services/template.service');
const subscriptionRepository = require('../../subscription/repositories/subscription.repository');
const prisma = require('../../../database/prisma');
const emailUtils = require('../../../utils/email.utils');

class UserService {
    constructor() {}

    async getUsers(companyId, isSuperAdmin, currentUserId, page, limit, search, filters) {
        return await userRepository.getAllUsers(companyId, isSuperAdmin, currentUserId, page, limit, search, filters);
    }

    async getUser(id) {
        return await userRepository.getUserById(id);
    }

    async createUser(data, adminCompanyId, isSuperAdmin) {
        const { first_name, last_name, email, role_name, company_id, mobile_number } = data;

        // Check if user already exists
        const existingUser = await userRepository.getUserByEmail(email);
        if (existingUser) throw new Error('User with this email already exists');

        const role = await roleRepository.findByName(role_name);
        if (!role) throw new Error('Invalid role name');

        if (!isSuperAdmin && (role_name === 'admin' || role_name === 'super_admin')) {
            throw new Error('Access denied. Only Super Admin can create Admin or Super Admin accounts.');
        }

        const targetCompanyId = isSuperAdmin ? (company_id || adminCompanyId) : adminCompanyId;

        // --- Staff Limit Enforcement ---
        if (targetCompanyId) {
            const subscription = await subscriptionRepository.getActiveSubscriptionWithPlan(targetCompanyId);
            
            if (subscription && subscription.plan.staffLimit !== null) {
                const count = await prisma.user.count({
                    where: { companyId: targetCompanyId }
                });

                if (count >= subscription.plan.staffLimit) {
                    throw new Error(`STAFF_LIMIT_REACHED: Your current plan only allows ${subscription.plan.staffLimit} staff members.`);
                }
            }
        }

        const tempPassword = data.password || Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        
        const user = await userRepository.createUser({
            first_name,
            last_name,
            email,
            password: passwordHash,
            mobile_number,
            role_id: role.id,
            company_id: targetCompanyId
        });

        // Notifications
        const company = await prisma.company.findUnique({ where: { id: targetCompanyId } });
        await this.sendStaffWelcomeEmail(user, targetCompanyId, role_name, tempPassword);
        
        // --- Super Admin Alert ---
        await this.notifySuperAdmins(user, role_name, company);

        return user;
    }

    async notifySuperAdmins(newUser, roleName, company) {
        try {
            const superAdmins = await prisma.user.findMany({
                where: { role: { name: 'super_admin' } }
            });

            const html = await templateService.getTemplate('staff-alert', {
                companyName: company ? company.name : 'Unknown',
                adminName: 'Company Admin', // You can refine this to show who added them
                staffName: `${newUser.firstName} ${newUser.lastName || ''}`,
                role: roleName.toUpperCase(),
                email: newUser.email,
                timestamp: new Date().toLocaleString()
            });

            for (const admin of superAdmins) {
                await emailUtils.sendEmail({
                    to: admin.email,
                    subject: `🚀 New Staff Member Added: ${company ? company.name : 'N/A'}`,
                    html
                });
            }
        } catch (error) {
            console.error('[SUPER ADMIN NOTIFY ERROR]', error);
        }
    }

    async getDashboardStats(companyId, roleName) {
        if (roleName === 'super_admin') {
            // Stats for Super Admin (Total Ecosystem Oversight)
            const [totalCompanies, totalAdmins, totalStaff] = await Promise.all([
                prisma.company.count(),
                prisma.user.count({ where: { role: { name: 'admin' } } }),
                prisma.user.count({ where: { role: { name: { notIn: ['super_admin', 'admin'] } } } })
            ]);

            return {
                scope: 'ecosystem',
                totalCompanies,
                totalAdmins,
                totalStaff,
                timestamp: new Date().toISOString()
            };
        } else {
            // Stats for Company Admin (Private Company View)
            const subscription = await subscriptionRepository.getActiveSubscriptionWithPlan(companyId);
            
            // Only count staff (Engineers, Planners, etc.), NOT Admins/Super Admins
            const totalStaff = await prisma.user.count({ 
                where: { 
                    companyId,
                    role: { name: { notIn: ['admin', 'super_admin'] } }
                } 
            });

            return {
                scope: 'company',
                totalStaff,
                staffLimit: subscription?.plan?.staffLimit || 'Unlimited',
                activePlan: subscription?.plan?.planName || 'No Active Plan',
                planExpiry: subscription?.subscriptionEndDate || 'N/A',
                isLimitReached: subscription?.plan?.staffLimit ? totalStaff >= subscription.plan.staffLimit : false
            };
        }
    }

    async getCompanySummaries() {
        return await userRepository.getCompanySummaries();
    }

    async updateUser(id, data) {
        const updateData = { ...data };
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        if (data.role_name) {
            const role = await roleRepository.findByName(data.role_name);
            if (role) updateData.role_id = role.id;
            delete updateData.role_name;
        }

        return await userRepository.updateUser(id, updateData);
    }

    async deleteUser(id) {
        return await userRepository.deleteUser(id);
    }

    async sendStaffWelcomeEmail(user, companyId, role, plainPassword) {
        try {
            const company = await prisma.company.findUnique({ where: { id: companyId } });
            
            const html = await templateService.getTemplate('staff-welcome', {
                name: user.firstName,
                roleName: role.toUpperCase(),
                companyName: company ? company.name : 'HME Global',
                companyCode: company ? company.companyCode : 'N/A',
                email: user.email,
                password: plainPassword,
                loginUrl: 'https://hme-intelligence.com/login' // Update with real frontend URL
            });

            await emailUtils.sendEmail({
                to: user.email,
                subject: 'Welcome to the HME Team! 👷‍♂️',
                html
            });
        } catch (error) {
            console.error('[STAFF WELCOME EMAIL ERROR]', error);
        }
    }
}

module.exports = new UserService();
