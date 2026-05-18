const roleService = require('../services/role.service');
const responseHandler = require('../../../utils/responseHandler');

class RoleController {
    async getRoles(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await roleService.getAllRoles(page, limit);
            return responseHandler(res, 200, 'Roles fetched successfully', result);
        } catch (error) {
            next(error);
        }
    }

    async getRole(req, res, next) {
        try {
            const role = await roleService.getRole(req.params.id);
            if (!role) return responseHandler(res, 404, 'Role not found');
            return responseHandler(res, 200, 'Role details fetched successfully', role);
        } catch (error) {
            next(error);
        }
    }

    async createRole(req, res, next) {
        try {
            const role = await roleService.createRole(req.body);
            return responseHandler(res, 201, 'Role created successfully', role);
        } catch (error) {
            next(error);
        }
    }

    async updateRole(req, res, next) {
        try {
            const role = await roleService.updateRole(req.params.id, req.body);
            return responseHandler(res, 200, 'Role updated successfully', role);
        } catch (error) {
            next(error);
        }
    }

    async deleteRole(req, res, next) {
        try {
            await roleService.deleteRole(req.params.id);
            return responseHandler(res, 200, 'Role deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RoleController();
