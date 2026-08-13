const prisma = require('../../../database/prisma');

class UserRepository {
    async getAllUsers(companyId, isSuperAdmin, currentUserId, page = 1, limit = 10, search = '', filters = {}) {
        const parsedPage = parseInt(page) || 1;
        const parsedLimit = parseInt(limit) || 10;
        const skip = (parsedPage - 1) * parsedLimit;
        
        const where = {
            AND: [
                !isSuperAdmin ? { role: { name: { notIn: ['super_admin', 'sub_super_admin'] } } } : { role: { name: { not: 'super_admin' } } },
                { id: { not: currentUserId } },
                // If super admin and companyId provided, filter by it. 
                // If not super admin, always filter by their own companyId.
                isSuperAdmin && (filters.companyId || filters.company_id) ? { companyId: filters.companyId || filters.company_id } : (!isSuperAdmin ? { companyId } : {}),
                search ? {
                    OR: [
                        { firstName: { contains: search, mode: 'insensitive' } },
                        { lastName: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } }
                    ]
                } : {},
                filters.role_name ? { role: { name: filters.role_name } } : {},
                filters.is_active !== undefined ? { isActive: filters.is_active === 'true' } : {}
            ]
        };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    mobileNumber: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    role: true,
                    company: true
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parsedLimit
            }),
            prisma.user.count({ where })
        ]);

        return {
            users,
            pagination: {
                total,
                page: parsedPage,
                limit: parsedLimit,
                pages: Math.ceil(total / parsedLimit)
            }
        };
    }

    async getUserById(id) {
        return await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                mobileNumber: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                role: true,
                company: true
            }
        });
    }

    async getUserByEmail(email) {
        return await prisma.user.findUnique({
            where: { email },
            include: { role: true, company: true }
        });
    }

    async createUser(userData) {
        const user = await prisma.user.create({
            data: {
                firstName: userData.first_name,
                lastName: userData.last_name,
                email: userData.email,
                password: userData.password,
                roleId: userData.role_id,
                companyId: userData.companyId || userData.company_id,
                mobileNumber: userData.mobile_number,
                isActive: userData.is_active ?? true
            }
        });

        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async updateUser(id, userData) {
        return await prisma.user.update({
            where: { id },
            data: {
                firstName: userData.first_name,
                lastName: userData.last_name,
                email: userData.email,
                mobileNumber: userData.mobile_number,
                isActive: userData.is_active
            }
        });
    }

    async deleteUser(id) {
        return await prisma.user.delete({
            where: { id }
        });
    }


    async getCompanySummaries() {
        // Fetch all companies with their users and subscriptions
        const companies = await prisma.company.findMany({
            include: {
                users: {
                    include: { role: true }
                },
                subscriptions: {
                    include: { plan: true },
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        return companies.map(company => {
            const usersList = Array.isArray(company.users) ? company.users : [];
            const admin = usersList.find(u => u.role?.name === 'admin');
            const staffCount = usersList.filter(u => u.role?.name !== 'admin' && u.role?.name !== 'super_admin').length;
            const activePlan = company.subscriptions?.[0]?.plan?.planName || 'None';

            return {
                id: company.id,
                adminId: admin ? admin.id : null,
                adminRole: admin?.role?.name || 'admin',
                companyName: company.name || 'Unnamed Company',
                companyCode: company.companyCode || 'N/A',
                adminEmail: admin ? admin.email : 'N/A',
                adminName: admin ? `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'N/A' : 'N/A',
                staffCount: staffCount,
                activePlan: activePlan,
                isActive: admin ? admin.isActive : true,
                status: admin ? (admin.isActive ? 'Active' : 'Inactive') : 'Inactive',
                createdAt: company.createdAt
            };
        });
    }

    async getCompanyStaff(companyId) {
        const staff = await prisma.user.findMany({
            where: {
                companyId,
                role: {
                    name: {
                        notIn: ['admin', 'super_admin', 'sub_super_admin']
                    }
                }
            },
            include: {
                role: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return staff.map(user => {
            const { password, roleId, role, ...rest } = user;
            return {
                ...rest,
                role: role ? role.name : null
            };
        });
    }
}

module.exports = new UserRepository();
