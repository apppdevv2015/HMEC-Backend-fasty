const prisma = require('../../../database/prisma');

class RoleRepository {
    async getAllRoles() {
        return await prisma.role.findMany({
            orderBy: { name: 'asc' }
        });
    }

    async getRoleById(id) {
        return await prisma.role.findUnique({
            where: { id }
        });
    }

    async createRole(roleData) {
        const normalizedName = String(roleData.name || '').toLowerCase().trim();
        const existingRole = await prisma.role.findFirst({
            where: {
                name: {
                    equals: normalizedName,
                    mode: 'insensitive'
                }
            }
        });
        if (existingRole) {
            const error = new Error(`Role with name '${roleData.name}' already exists.`);
            error.statusCode = 400;
            throw error;
        }

        return await prisma.role.create({
            data: {
                name: normalizedName
            }
        });
    }

    async updateRole(id, roleData) {
        let isActive = undefined;
        if (roleData.is_active !== undefined) {
            isActive = Boolean(roleData.is_active === true || roleData.is_active === 'true' || roleData.is_active === 'active');
        } else if (roleData.isActive !== undefined) {
            isActive = Boolean(roleData.isActive === true || roleData.isActive === 'true' || roleData.isActive === 'active');
        } else if (roleData.status !== undefined) {
            isActive = String(roleData.status).toLowerCase() === 'active';
        }

        if (isActive !== undefined && roleData.name) {
            const normalizedName = String(roleData.name).toLowerCase().trim();
            await prisma.$executeRawUnsafe(
                `UPDATE "Role" SET "is_active" = $1, "name" = $2, "updatedAt" = NOW() WHERE "id" = $3`,
                isActive, normalizedName, id
            );
        } else if (isActive !== undefined) {
            await prisma.$executeRawUnsafe(
                `UPDATE "Role" SET "is_active" = $1, "updatedAt" = NOW() WHERE "id" = $2`,
                isActive, id
            );
        } else if (roleData.name) {
            const normalizedName = String(roleData.name).toLowerCase().trim();
            await prisma.$executeRawUnsafe(
                `UPDATE "Role" SET "name" = $1, "updatedAt" = NOW() WHERE "id" = $2`,
                normalizedName, id
            );
        }

        return await prisma.role.findUnique({ where: { id } });
    }

    async deleteRole(id) {
        const usersCount = await prisma.user.count({
            where: { roleId: id }
        });
        if (usersCount > 0) {
            const error = new Error(`Cannot delete this role because ${usersCount} user(s) are assigned to it. Please reassign the users first.`);
            error.statusCode = 400;
            throw error;
        }

        return await prisma.role.delete({
            where: { id }
        });
    }

    async findByName(name) {
        return await prisma.role.findUnique({
            where: { name }
        });
    }
}

module.exports = new RoleRepository();
