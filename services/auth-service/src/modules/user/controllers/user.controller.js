const userService = require('../services/user.service');
const responseHandler = require('../../../utils/responseHandler');

class UserController {
    async getUsers(req, res) {
        try {
            const { page, limit, search, role_name, is_active, company_id } = req.query;
            const companyId = req.user.companyId;
            const isSuperAdmin = req.user.role === 'super_admin';
            
            const result = await userService.getUsers(
                companyId, 
                isSuperAdmin, 
                req.user.id, 
                page, 
                limit, 
                search, 
                { role_name, is_active, company_id }
            );
            return responseHandler(res, 200, 'Users fetched successfully', result);
        } catch (error) {
            throw error;
        }
    }

    async getUser(req, res) {
        try {
            const user = await userService.getUser(req.params.id);
            if (!user) return responseHandler(res, 404, 'User not found');
            return responseHandler(res, 200, 'User fetched successfully', user);
        } catch (error) {
            throw error;
        }
    }

    async createUser(req, res) {
        try {
            const adminCompanyId = req.user.companyId;
            const isSuperAdmin = req.user.role === 'super_admin';
            
            const user = await userService.createUser(req.body, adminCompanyId, isSuperAdmin);
            return responseHandler(res, 201, 'User created successfully', user);
        } catch (error) {
            throw error;
        }
    }

    async updateUser(req, res) {
        try {
            const user = await userService.updateUser(req.params.id, req.body);
            return responseHandler(res, 200, 'User updated successfully', user);
        } catch (error) {
            throw error;
        }
    }

    async deleteUser(req, res) {
        try {
            await userService.deleteUser(req.params.id);
            return responseHandler(res, 200, 'User deleted successfully');
        } catch (error) {
            throw error;
        }
    }

    async getCompanySummaries(req, res) {
        try {
            if (req.user.role !== 'super_admin') {
                return responseHandler(res, 403, 'Access denied. Super Admin only.');
            }
            const result = await userService.getCompanySummaries();
            return responseHandler(res, 200, 'Company summaries fetched successfully', result);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new UserController();

