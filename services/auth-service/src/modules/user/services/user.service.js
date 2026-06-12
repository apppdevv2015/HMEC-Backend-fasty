const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const roleRepository = require('../../role/repositories/role.repository');
const templateService = require('../../auth/services/template.service');
const subscriptionRepository = require('../../subscription/repositories/subscription.repository');
const prisma = require('../../../database/prisma');
const emailUtils = require('../../../utils/email.utils');
const { createClient } = require('redis');
const notificationRepository = require('../../notification/repositories/notification.repository');

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

        // --- Single Admin per Company Enforcement ---
        if (role_name === 'admin' && targetCompanyId) {
            const existingAdmin = await prisma.user.findFirst({
                where: {
                    companyId: targetCompanyId,
                    role: { name: 'admin' }
                }
            });
            if (existingAdmin) {
                throw new Error('COMPANY_ADMIN_LIMIT_REACHED: This company already has an Admin. Only one Admin per company is allowed.');
            }
        }

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

        // --- Save Notification to Database ---
        let savedDbAlert;
        try {
            savedDbAlert = await notificationRepository.createNotification({
                companyId: targetCompanyId,
                message: `👥 [STAFF ALERT] New Staff Member (${first_name} ${last_name}) has been successfully added to company "${company ? company.name : 'Workspace'}" as ${role_name.toUpperCase()}.`,
                type: 'staff'
            });
        } catch (dbErr) {
            console.error('[DB-NOTIFICATION-ERROR] Failed to save staff alert to database:', dbErr.message);
        }

        // --- Real-time WebSocket Alert ---
        const alertPayload = {
            id: savedDbAlert ? savedDbAlert.id : 'alert-' + Date.now(),
            severity: 'INFO',
            component: 'Staff Manager',
            message: `👥 [STAFF ALERT] New Staff Member (${first_name} ${last_name}) has been successfully added to company "${company ? company.name : 'Workspace'}" as ${role_name.toUpperCase()}.`,
            timestamp: new Date().toISOString()
        };
        publishRedisAlert('role:Admin:alerts', alertPayload);
        publishRedisAlert('alerts:global', alertPayload);

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
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Stats for Super Admin (Total Ecosystem Oversight)
            const [
                totalAdmins,
                activePlans,
                totalOperators,
                totalMechanics,
                criticalAlerts,
                plans,
                recentUsers,
                recentSubs,
                recentMachines,
                recentAlerts,
                machines,
                alertComponents
            ] = await Promise.all([
                prisma.user.count({ where: { role: { name: 'admin' } } }),
                prisma.subscriptionPlan.count({ where: { isActive: true } }),
                prisma.user.count({ where: { role: { name: 'planner' } } }),
                prisma.user.count({ where: { role: { name: 'engineer' } } }),
                prisma.component.count({ where: { condition: 5 } }),
                prisma.subscriptionPlan.findMany({ include: { subscriptions: true } }),
                prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { role: true, company: true } }),
                prisma.subscription.findMany({ take: 3, orderBy: { createdAt: 'desc' }, include: { company: true, plan: true } }),
                prisma.machine.findMany({ take: 3, orderBy: { createdAt: 'desc' } }),
                prisma.component.findMany({ where: { condition: 5 }, take: 3, orderBy: { updatedAt: 'desc' }, include: { machine: true } }),
                prisma.machine.findMany({ select: { status: true } }),
                prisma.component.findMany({
                    where: {
                        condition: { in: [4, 5] },
                        updatedAt: { gte: sevenDaysAgo }
                    },
                    select: { condition: true, updatedAt: true }
                })
            ]);

            const totalMachines = machines.length;

            // Calculate Plan Distribution percentages
            const totalSubscriptions = plans.reduce((acc, p) => acc + p.subscriptions.length, 0);
            const planDistribution = plans.map(p => {
                const count = p.subscriptions.length;
                const percentage = totalSubscriptions > 0 
                    ? Math.round((count / totalSubscriptions) * 100) 
                    : 0;
                return {
                    name: p.planName.charAt(0).toUpperCase() + p.planName.slice(1),
                    value: percentage,
                    count
                };
            });

            // Compile activities
            const userActivities = recentUsers.map(u => ({
                title: `${u.firstName} ${u.lastName || ''}`.trim() + ` registered as ${u.role.name.replace('_', ' ')}`,
                time: u.createdAt,
                iconType: 'user',
                color: 'bg-green-500/15 text-green-500'
            }));

            const subActivities = recentSubs.map(s => ({
                title: `${s.company?.name || 'Company'} subscribed to ${s.plan.planName.toUpperCase()} plan`,
                time: s.createdAt,
                iconType: 'plan',
                color: 'bg-purple-500/15 text-purple-500'
            }));

            const machineActivities = recentMachines.map(m => ({
                title: `New Machine "${m.name}" (${m.model}) added`,
                time: m.createdAt,
                iconType: 'machine',
                color: 'bg-orange-500/15 text-orange-500'
            }));

            const alertActivities = recentAlerts.map(c => ({
                title: `Critical alert reported on component "${c.description}" of Machine "${c.machine.name}"`,
                time: c.updatedAt,
                iconType: 'alert',
                color: 'bg-red-500/15 text-red-500'
            }));

            // Merge and sort by newest
            const recentActivity = [...userActivities, ...subActivities, ...machineActivities, ...alertActivities]
                .sort((a, b) => new Date(b.time) - new Date(a.time))
                .slice(0, 5);

            // Machine Status splits
            let operational = 0;
            let maintenance = 0;
            let offline = 0;

            machines.forEach(m => {
                const s = (m.status || 'Healthy').toLowerCase();
                if (s === 'healthy' || s === 'operational' || s === 'active') {
                    operational++;
                } else if (s === 'maintenance' || s === 'under maintenance' || s === 'servicing') {
                    maintenance++;
                } else {
                    offline++;
                }
            });

            const machineStatusOverview = {
                operational,
                maintenance,
                offline
            };

            // Alert Summary over last 7 days
            const dayNames = [];
            const alertDataMap = {};
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                dayNames.push(label);
                alertDataMap[label] = { day: label, critical: 0, warning: 0 };
            }

            alertComponents.forEach(c => {
                const label = new Date(c.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (alertDataMap[label]) {
                    if (c.condition === 5) {
                        alertDataMap[label].critical++;
                    } else if (c.condition === 4) {
                        alertDataMap[label].warning++;
                    }
                }
            });

            const alertSummary = dayNames.map(label => alertDataMap[label]);

            return {
                scope: 'ecosystem',
                totalAdmins,
                activePlans,
                totalOperators,
                totalMechanics,
                totalMachines,
                criticalAlerts,
                planDistribution,
                recentActivity,
                machineStatusOverview,
                alertSummary,
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

        const currentUser = await prisma.user.findUnique({
            where: { id },
            include: { role: true }
        });
        if (!currentUser) throw new Error('User not found');

        if (data.role_name) {
            const role = await roleRepository.findByName(data.role_name);
            if (role) {
                updateData.role_id = role.id;
                
                // If moving to admin, enforce single admin per company restriction
                if (data.role_name === 'admin' && currentUser.role.name !== 'admin') {
                    const existingAdmin = await prisma.user.findFirst({
                        where: {
                            companyId: currentUser.companyId,
                            role: { name: 'admin' },
                            id: { not: id }
                        }
                    });
                    if (existingAdmin) {
                        throw new Error('COMPANY_ADMIN_LIMIT_REACHED: This company already has an Admin. Only one Admin per company is allowed.');
                    }
                }
            }
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
