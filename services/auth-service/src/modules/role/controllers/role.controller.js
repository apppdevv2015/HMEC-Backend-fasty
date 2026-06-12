const roleService = require('../services/role.service');
const responseHandler = require('../../../utils/responseHandler');

class RoleController {
    async getRoles(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await roleService.getAllRoles(page, limit);
            return responseHandler(res, 200, 'Roles fetched successfully', result);
        } catch (error) {
            throw error;
        }
    }

    async getRole(req, res) {
        try {
            const role = await roleService.getRole(req.params.id);
            if (!role) return responseHandler(res, 404, 'Role not found');
            return responseHandler(res, 200, 'Role details fetched successfully', role);
        } catch (error) {
            throw error;
        }
    }

    async createRole(req, res) {
        try {
            const role = await roleService.createRole(req.body);
            return responseHandler(res, 201, 'Role created successfully', role);
        } catch (error) {
            throw error;
        }
    }

    async updateRole(req, res) {
        try {
            const role = await roleService.updateRole(req.params.id, req.body);
            return responseHandler(res, 200, 'Role updated successfully', role);
        } catch (error) {
            throw error;
        }
    }

    async deleteRole(req, res) {
        try {
            await roleService.deleteRole(req.params.id);
            return responseHandler(res, 200, 'Role deleted successfully');
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new RoleController();

