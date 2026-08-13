const roleService = require('../services/role.service');
const responseHandler = require('../../../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

class RoleController {
    async getRoles(req, res) {
        try {
            const result = await roleService.getAllRoles();
            return responseHandler(res, HTTP_STATUS.OK, 'Roles fetched successfully', result);
        } catch (error) {
            throw error;
        }
    }

    async getRole(req, res) {
        try {
            const role = await roleService.getRole(req.params.id);
            if (!role) return responseHandler(res, HTTP_STATUS.NOT_FOUND, 'Role not found');
            return responseHandler(res, HTTP_STATUS.OK, 'Role details fetched successfully', role);
        } catch (error) {
            throw error;
        }
    }

    async createRole(req, res) {
        try {
            const role = await roleService.createRole(req.body);
            return responseHandler(res, HTTP_STATUS.CREATED, 'Role created successfully', role);
        } catch (error) {
            throw error;
        }
    }

    async updateRole(req, res) {
        try {
            const role = await roleService.updateRole(req.params.id, req.body);
            return responseHandler(res, HTTP_STATUS.OK, 'Role updated successfully', role);
        } catch (error) {
            throw error;
        }
    }

    async deleteRole(req, res) {
        try {
            await roleService.deleteRole(req.params.id);
            return responseHandler(res, HTTP_STATUS.OK, 'Role deleted successfully');
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new RoleController();

