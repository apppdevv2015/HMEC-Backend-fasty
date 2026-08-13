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
        return await prisma.role.update({
            where: { id },
            data: {
                name: roleData.name
            }
        });
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
