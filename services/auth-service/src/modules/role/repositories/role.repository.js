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
        return await prisma.role.create({
            data: {
                name: roleData.name
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
