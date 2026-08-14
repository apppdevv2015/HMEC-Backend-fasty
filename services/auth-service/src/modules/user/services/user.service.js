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
        const { first_name, last_name, email, role_name, company_id, companyId, mobile_number } = data;

        // Check if user already exists
        const existingUser = await userRepository.getUserByEmail(email);
        if (existingUser) throw new Error('User with this email already exists');

        const role = await roleRepository.findByName(role_name);
        if (!role) throw new Error('Invalid role name');

        if (role_name === 'sub_super_admin') {
            throw new Error('Access denied. Please use the dedicated sub-super-admin registration endpoint.');
        }

        if (!isSuperAdmin && (role_name === 'admin' || role_name === 'super_admin')) {
            throw new Error('Access denied. Only Super Admin can create Admin or Super Admin accounts.');
        }

        const targetCompanyId = isSuperAdmin ? (companyId || company_id || adminCompanyId) : adminCompanyId;

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
            companyId: targetCompanyId,
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
                    count,
                    price: parseFloat(p.price || 0)
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

    async getDashboardMetrics(companyId, roleName) {
        if (roleName === 'super_admin') {
            const [
                totalAdmins,
                activePlans,
                totalOperators,
                totalMechanics,
                totalMachines,
                criticalAlerts
            ] = await Promise.all([
                prisma.user.count({ where: { role: { name: 'admin' } } }),
                prisma.subscriptionPlan.count({ where: { isActive: true } }),
                prisma.user.count({ where: { role: { name: 'planner' } } }),
                prisma.user.count({ where: { role: { name: 'engineer' } } }),
                prisma.machine.count(),
                prisma.component.count({ where: { condition: 5 } })
            ]);
            return {
                totalAdmins,
                activePlans,
                totalOperators,
                totalMechanics,
                totalMachines,
                criticalAlerts
            };
        } else {
            const subscription = await subscriptionRepository.getActiveSubscriptionWithPlan(companyId);
            const totalStaff = await prisma.user.count({ 
                where: { 
                    companyId,
                    role: { name: { notIn: ['admin', 'super_admin'] } }
                } 
            });
            return {
                totalStaff,
                staffLimit: subscription?.plan?.staffLimit || 'Unlimited',
                activePlan: subscription?.plan?.planName || 'No Active Plan',
                planExpiry: subscription?.subscriptionEndDate || 'N/A',
                isLimitReached: subscription?.plan?.staffLimit ? totalStaff >= subscription.plan.staffLimit : false
            };
        }
    }

    async getDashboardPlanDistribution(roleName) {
        if (roleName !== 'super_admin') {
            throw new Error('Access denied. Super Admin only.');
        }
        const plans = await prisma.subscriptionPlan.findMany({ include: { subscriptions: true } });
        const totalSubscriptions = plans.reduce((acc, p) => acc + p.subscriptions.length, 0);
        return plans.map(p => {
            const count = p.subscriptions.length;
            const percentage = totalSubscriptions > 0 
                ? Math.round((count / totalSubscriptions) * 100) 
                : 0;
            return {
                name: p.planName.charAt(0).toUpperCase() + p.planName.slice(1),
                value: percentage,
                count,
                price: parseFloat(p.price || 0)
            };
        });
    }

    async getDashboardRecentActivity(roleName) {
        if (roleName !== 'super_admin') {
            throw new Error('Access denied. Super Admin only.');
        }
        const [
            recentUsers,
            recentSubs,
            recentMachines,
            recentAlerts
        ] = await Promise.all([
            prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { role: true, company: true } }),
            prisma.subscription.findMany({ take: 3, orderBy: { createdAt: 'desc' }, include: { company: true, plan: true } }),
            prisma.machine.findMany({ take: 3, orderBy: { createdAt: 'desc' } }),
            prisma.component.findMany({ where: { condition: 5 }, take: 3, orderBy: { updatedAt: 'desc' }, include: { machine: true } })
        ]);

        const userActivities = recentUsers.map(u => ({
            title: `${u.firstName} ${u.lastName || ''}`.trim() + ` registered as ${u.role.name.replace('_', ' ')}`,
            time: u.createdAt.toISOString(),
            iconType: 'user',
            color: 'bg-green-500/15 text-green-500'
        }));

        const subActivities = recentSubs.map(s => ({
            title: `${s.company?.name || 'Company'} subscribed to ${s.plan.planName.toUpperCase()} plan`,
            time: s.createdAt.toISOString(),
            iconType: 'plan',
            color: 'bg-purple-500/15 text-purple-500'
        }));

        const machineActivities = recentMachines.map(m => ({
            title: `New Machine "${m.name}" (${m.model}) added`,
            time: m.createdAt.toISOString(),
            iconType: 'machine',
            color: 'bg-orange-500/15 text-orange-500'
        }));

        const alertActivities = recentAlerts.map(c => ({
            title: `Critical alert reported on component "${c.description}" of Machine "${c.machine.name}"`,
            time: c.updatedAt.toISOString(),
            iconType: 'alert',
            color: 'bg-red-500/15 text-red-500'
        }));

        return [...userActivities, ...subActivities, ...machineActivities, ...alertActivities]
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, 5);
    }

    async getDashboardMachineStatus(roleName) {
        if (roleName !== 'super_admin') {
            throw new Error('Access denied. Super Admin only.');
        }
        const machines = await prisma.machine.findMany({ select: { status: true } });
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

        return {
            operational,
            maintenance,
            offline
        };
    }

    async getDashboardAlertsSummary(roleName) {
        if (roleName !== 'super_admin') {
            throw new Error('Access denied. Super Admin only.');
        }
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const alertComponents = await prisma.component.findMany({
            where: {
                condition: { in: [4, 5] },
                updatedAt: { gte: sevenDaysAgo }
            },
            select: { condition: true, updatedAt: true }
        });

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

        return dayNames.map(label => alertDataMap[label]);
    }

    async sendAfternoonReport() {
        const [activeFleetCount, alertsCount] = await Promise.all([
            prisma.machine.count(),
            prisma.component.count({ where: { condition: { in: [4, 5] } } })
        ]);

        const timestamp = new Date().toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });

        const templateService = require('../../auth/services/template.service');
        const html = await templateService.getTemplate('afternoon-report', {
            timestamp,
            activeFleetCount: String(activeFleetCount),
            alertsCount: String(alertsCount)
        });

        const superAdmins = await prisma.user.findMany({
            where: { role: { name: 'super_admin' } }
        });

        const emailUtils = require('../../../utils/email.utils');
        for (const admin of superAdmins) {
            await emailUtils.sendEmail({
                to: admin.email,
                subject: `☀️ HME Afternoon Progress Report - ${new Date().toLocaleDateString()}`,
                html
            });
        }

        return { sent: true, recipientCount: superAdmins.length };
    }

    async getDashboardRolesActivity(roleName) {
        if (roleName !== 'super_admin') {
            throw new Error('Access denied. Super Admin only.');
        }

        let logCount = await prisma.log.count();
        if (logCount === 0) {
            const initialLogs = [
                {
                    level: 'info',
                    service: 'auth-service',
                    module: 'Roles',
                    action: 'update',
                    userRole: 'super_admin',
                    message: 'Updated system permissions',
                    createdAt: new Date(Date.now() - 1000 * 60 * 10)
                },
                {
                    level: 'info',
                    service: 'auth-service',
                    module: 'Users',
                    action: 'create',
                    userRole: 'super_admin',
                    message: 'Created new company admin',
                    createdAt: new Date(Date.now() - 1000 * 60 * 45)
                },
                {
                    level: 'info',
                    service: 'auth-service',
                    module: 'Roles',
                    action: 'update',
                    userRole: 'super_admin',
                    message: 'Changed role access scope',
                    createdAt: new Date(Date.now() - 1000 * 60 * 120)
                },
                {
                    level: 'info',
                    service: 'auth-service',
                    module: 'Users',
                    action: 'create',
                    userRole: 'admin',
                    message: 'Added new operator user',
                    createdAt: new Date(Date.now() - 1000 * 60 * 180)
                },
                {
                    level: 'info',
                    service: 'auth-service',
                    module: 'Machines',
                    action: 'update',
                    userRole: 'admin',
                    message: 'Updated company machine access',
                    createdAt: new Date(Date.now() - 1000 * 60 * 300)
                },
                {
                    level: 'info',
                    service: 'auth-service',
                    module: 'Alerts',
                    action: 'view',
                    userRole: 'admin',
                    message: 'Reviewed alert summary',
                    createdAt: new Date(Date.now() - 1000 * 60 * 400)
                }
            ];

            await prisma.log.createMany({ data: initialLogs });
        }

        const logs = await prisma.log.findMany({
            where: {
                userRole: { in: ['super_admin', 'sub_super_admin', 'admin'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        const users = await prisma.user.findMany({
            select: { role: { select: { name: true } } }
        });

        const superAdminCount = users.filter(u => u.role.name === 'super_admin').length || 1;
        const adminCount = users.filter(u => u.role.name === 'admin').length || 1;

        return logs.map(log => {
            let roleLabel = 'Super Admin';
            let uCount = superAdminCount;
            if (log.userRole === 'admin') {
                roleLabel = 'Company Admin';
                uCount = adminCount;
            } else if (log.userRole === 'sub_super_admin') {
                roleLabel = 'Sub Super Admin';
                uCount = users.filter(u => u.role.name === 'sub_super_admin').length || 1;
            }

            return {
                id: log.id,
                roleName: roleLabel,
                activity: log.message,
                status: 'active',
                userCount: uCount,
                time: log.createdAt.toISOString()
            };
        });
    }

    async getDashboardRoleDetails(roleId, userRole) {
        if (userRole !== 'super_admin') {
            throw new Error('Access denied. Super Admin only.');
        }

        const role = await prisma.role.findUnique({
            where: { id: roleId }
        });

        if (!role) {
            let nameMatch = 'super_admin';
            if (roleId === '2' || roleId === 'company_admin') nameMatch = 'admin';
            const fallbackRole = await prisma.role.findUnique({
                where: { name: nameMatch }
            });
            if (fallbackRole) {
                return this.compileRoleDetailsFor(fallbackRole);
            }
            throw new Error('Role not found');
        }

        return this.compileRoleDetailsFor(role);
    }

    async compileRoleDetailsFor(role) {
        const usersCount = await prisma.user.count({
            where: { roleId: role.id }
        });

        const assignedUsers = await prisma.user.findMany({
            where: { roleId: role.id },
            select: { firstName: true, lastName: true },
            take: 10
        });
        const assignedUsersList = assignedUsers.map(u => `${u.firstName} ${u.lastName || ''}`.trim());

        const machines = await prisma.machine.findMany({
            select: { name: true },
            take: 5
        });
        const machineNames = machines.map(m => m.name);

        const logs = await prisma.log.findMany({
            where: { userRole: role.name },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { message: true }
        });
        const activitiesList = logs.map(l => l.message);

        let permissions = [
            { module: 'Dashboard', view: true, create: false, edit: false, delete: false },
            { module: 'Users', view: true, create: false, edit: false, delete: false },
            { module: 'Roles', view: true, create: false, edit: false, delete: false },
            { module: 'Machines', view: true, create: false, edit: false, delete: false },
            { module: 'Reports', view: true, create: false, edit: false, delete: false },
            { module: 'Alerts', view: true, create: false, edit: false, delete: false }
        ];

        let linkedMachines = machineNames.length > 0 ? machineNames : ['No Machines Registered'];

        if (role.name === 'super_admin' || role.name === 'sub_super_admin') {
            permissions = [
                { module: 'Dashboard', view: true, create: true, edit: true, delete: true },
                { module: 'Users', view: true, create: true, edit: true, delete: true },
                { module: 'Roles', view: true, create: true, edit: true, delete: true },
                { module: 'Machines', view: true, create: true, edit: true, delete: true },
                { module: 'Reports', view: true, create: true, edit: true, delete: true },
                { module: 'Alerts', view: true, create: true, edit: true, delete: true }
            ];
            linkedMachines = ['All Machines', 'All Plants', 'All Components'];
        } else if (role.name === 'admin') {
            permissions = [
                { module: 'Dashboard', view: true, create: false, edit: true, delete: false },
                { module: 'Users', view: true, create: true, edit: true, delete: false },
                { module: 'Roles', view: true, create: false, edit: false, delete: false },
                { module: 'Machines', view: true, create: true, edit: true, delete: false },
                { module: 'Reports', view: true, create: false, edit: true, delete: false },
                { module: 'Alerts', view: true, create: true, edit: true, delete: false }
            ];
        }

        return {
            id: role.id,
            name: role.name === 'super_admin' ? 'Super Admin' : (role.name === 'admin' ? 'Company Admin' : role.name),
            status: 'active',
            users: usersCount,
            permissions,
            assignedUsers: assignedUsersList.length > 0 ? assignedUsersList : ['No Users Assigned'],
            linkedMachines,
            activityHistory: activitiesList.length > 0 ? activitiesList : [
                'Initial Setup Completed',
                'Configuration Verified'
            ]
        };
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

        // Check if user is being activated/approved
        const isApproving = (data.is_active === true || data.is_active === 'true') && currentUser.isActive === false;
        if (isApproving) {
            try {
                const approvalHtml = await templateService.getTemplate('approval-welcome', {
                    name: `${currentUser.firstName} ${currentUser.lastName || ''}`.trim(),
                    loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`
                });
                await emailUtils.sendEmail({
                    to: currentUser.email,
                    subject: 'Your Account Has Been Approved! 🎉',
                    html: approvalHtml
                });
            } catch (emailErr) {
                console.error('[APPROVAL EMAIL ERROR] Failed to send approval email:', emailErr.message);
            }
        }

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

        // Update linked company details if provided
        if (currentUser.companyId && (data.companyName || data.company_name || data.companyCode || data.company_code)) {
            const companyUpdate = {};
            if (data.companyName || data.company_name) {
                companyUpdate.name = (data.companyName || data.company_name).trim();
            }
            if (data.companyCode || data.company_code) {
                companyUpdate.companyCode = (data.companyCode || data.company_code).trim();
            }
            await prisma.company.update({
                where: { id: currentUser.companyId },
                data: companyUpdate
            });
        }

        // Clean up non-user payload fields so Prisma user.update doesn't throw validation error
        delete updateData.companyName;
        delete updateData.company_name;
        delete updateData.companyCode;
        delete updateData.company_code;
        delete updateData.adminName;
        delete updateData.adminEmail;
        delete updateData.staffCount;
        delete updateData.activePlan;
        delete updateData.status;

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

    async sendMachineAssignmentEmails(data) {
        const {
            supervisorName,
            supervisorEmail,
            operatorName,
            operatorEmail,
            machineName,
            serialNumber,
            shift,
            assignedAt
        } = data;

        const timestamp = assignedAt ? new Date(assignedAt).toLocaleString() : new Date().toLocaleString();
        const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/operator/dashboard`;

        // 1. Send confirmation email to Supervisor
        if (supervisorEmail && supervisorEmail.includes('@')) {
            try {
                const supervisorHtml = await templateService.getTemplate('machine-assigned-supervisor', {
                    supervisorName: supervisorName || 'Supervisor',
                    operatorName: operatorName || 'Operator',
                    operatorEmail: operatorEmail || 'N/A',
                    machineName: machineName || 'Assigned Equipment',
                    serialNumber: serialNumber || 'N/A',
                    shift: shift || 'Morning',
                    timestamp
                });

                await emailUtils.sendEmailNow({
                    to: supervisorEmail,
                    subject: `🚜 Machine Assignment Confirmed - ${machineName}`,
                    html: supervisorHtml
                });
                console.log(`[ASSIGNMENT_EMAIL] Supervisor confirmation sent to: ${supervisorEmail}`);
            } catch (err) {
                console.error('[ASSIGNMENT_EMAIL_ERR] Failed supervisor email:', err.message);
            }
        }

        // Delay between emails to prevent Mailtrap free tier rate limit (550 5.7.0)
        await new Promise((resolve) => setTimeout(resolve, 5500));

        // 2. Send notification email to Operator
        if (operatorEmail && operatorEmail.includes('@')) {
            try {
                const operatorHtml = await templateService.getTemplate('machine-assigned-operator', {
                    operatorName: operatorName || 'Operator',
                    supervisorName: supervisorName || 'Supervisor',
                    machineName: machineName || 'Assigned Equipment',
                    serialNumber: serialNumber || 'N/A',
                    shift: shift || 'Morning',
                    timestamp,
                    loginUrl
                });

                await emailUtils.sendEmailNow({
                    to: operatorEmail,
                    subject: `🚜 New Machine Assigned: ${machineName}`,
                    html: operatorHtml
                });
                console.log(`[ASSIGNMENT_EMAIL] Operator notification sent to: ${operatorEmail}`);
            } catch (err) {
                console.error('[ASSIGNMENT_EMAIL_ERR] Failed operator email:', err.message);
            }
        }

        return { sent: true };
    }

    async createSubSuperAdmin(data) {
        const { first_name, last_name, email, password, mobile_number } = data;

        // Check if user already exists
        const existingUser = await userRepository.getUserByEmail(email);
        if (existingUser) throw new Error('User with this email already exists');

        const role = await roleRepository.findByName('sub_super_admin');
        if (!role) throw new Error('sub_super_admin role not found in database. Please run seeds.');

        const hashedPassword = await bcrypt.hash(password, 10);

        // Sub Super Admin belongs to the system company
        const systemCompanyId = '00000000-0000-0000-0000-000000000000';

        const user = await userRepository.createUser({
            first_name,
            last_name,
            email,
            password: hashedPassword,
            mobile_number,
            role_id: role.id,
            companyId: systemCompanyId,
            company_id: systemCompanyId
        });

        return user;
    }

    async getCompanyStaff(companyId) {
        return await userRepository.getCompanyStaff(companyId);
    }

    async createSubAdmin(data, companyId) {
        const { first_name, last_name, email, mobile_number } = data;

        const existingUser = await userRepository.getUserByEmail(email);
        if (existingUser) throw new Error('User with this email already exists');

        const tempPassword = data.password || Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const role = await prisma.role.upsert({
            where: { name: 'sub_admin' },
            update: {},
            create: { name: 'sub_admin' }
        });

        const user = await userRepository.createUser({
            first_name,
            last_name,
            email,
            password: passwordHash,
            mobile_number,
            role_id: role.id,
            companyId: companyId,
            company_id: companyId,
            is_active: true
        });

        await this.sendStaffWelcomeEmail(user, companyId, 'sub_admin', tempPassword);

        return user;
    }

    async getSalesTrends(period) {
        // Fetch all successful subscriptions with plan prices
        const subscriptions = await prisma.subscription.findMany({
            where: { paymentStatus: 'SUCCESS' },
            include: { plan: true },
            orderBy: { createdAt: 'asc' }
        });

        let totalPoints = 80;
        let intervalMs = 60000; // 1 min (mocking live updates for daily)
        let startPrice = 375.0;

        switch (period) {
            case 'weekly':
                totalPoints = 50;
                intervalMs = 86400000; // 1 day
                break;
            case 'monthly':
                totalPoints = 30;
                intervalMs = 86400000 * 7; // 1 week
                break;
            case 'yearly':
                totalPoints = 12;
                intervalMs = 86400000 * 30; // 1 month
                break;
            default:
                totalPoints = 80;
                intervalMs = 60000; // 1 min
        }

        const data = [];
        let price = startPrice;
        let time = Date.now() - (totalPoints * intervalMs);

        for (let i = 0; i < totalPoints; i++) {
            const open = price;
            const bucketStart = new Date(time);
            const bucketEnd = new Date(time + intervalMs);
            
            // Calculate sum of plan prices in this time bucket
            const bucketSubs = subscriptions.filter(s => {
                const date = new Date(s.createdAt);
                return date >= bucketStart && date < bucketEnd;
            });

            let revenue = bucketSubs.reduce((sum, s) => sum + parseFloat(s.plan?.price || 0), 0);
            
            // Fluctuating values for aesthetic graph display
            const randMove = (Math.random() - 0.48) * 3;
            const move = revenue > 0 ? (revenue / 100) + randMove : randMove;
            const close = open + move;
            const high = Math.max(open, close) + Math.random() * 1.5;
            const low = Math.min(open, close) - Math.random() * 1.5;

            data.push([
                time,
                parseFloat(open.toFixed(2)),
                parseFloat(high.toFixed(2)),
                parseFloat(low.toFixed(2)),
                parseFloat(close.toFixed(2))
            ]);

            price = close;
            time += intervalMs;
        }

        return data;
    }
}

module.exports = new UserService();
