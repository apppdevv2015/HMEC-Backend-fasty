const roleRepository = require('../repositories/role.repository');

class RoleService {
    async getAllRoles() {
        return await roleRepository.getAllRoles();
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
