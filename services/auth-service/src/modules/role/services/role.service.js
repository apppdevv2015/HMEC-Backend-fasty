const roleRepository = require('../repositories/role.repository');

class RoleService {
    async getAllRoles(page, limit) {
        return await roleRepository.getAllRoles(page, limit);
    }

    async getRole(id) {
        return await roleRepository.getRoleById(id);
    }

    async createRole(data) {
        return await roleRepository.createRole(data);
    }

    async updateRole(id, data) {
        return await roleRepository.updateRole(id, data);
    }

    async deleteRole(id) {
        return await roleRepository.deleteRole(id);
    }
}

module.exports = new RoleService();
