const userService = require('../services/user.service');
const responseHandler = require('../../../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

class UserController {
    async getUsers(req, res) {
        try {
            const { page, limit, search, role_name, is_active, company_id, companyId: queryCompanyId } = req.query;
            const companyId = req.user.companyId;
            const isSuperAdmin = req.user.role === 'super_admin';
            
            const result = await userService.getUsers(
                companyId, 
                isSuperAdmin, 
                req.user.id, 
                page, 
                limit, 
                search, 
                { role_name, is_active, companyId: queryCompanyId || company_id }
            );
            return responseHandler(res, HTTP_STATUS.OK, 'Users fetched successfully', result);
        } catch (error) {
            throw error;
        }
    }

    async getUser(req, res) {
        try {
            const user = await userService.getUser(req.params.id);
            if (!user) return responseHandler(res, HTTP_STATUS.NOT_FOUND, 'User not found');
            return responseHandler(res, HTTP_STATUS.OK, 'User fetched successfully', user);
        } catch (error) {
            throw error;
        }
    }

    async createUser(req, res) {
        try {
            const adminCompanyId = req.user.companyId;
            const isSuperAdmin = req.user.role === 'super_admin';
            
            const user = await userService.createUser(req.body, adminCompanyId, isSuperAdmin);
            return responseHandler(res, HTTP_STATUS.CREATED, 'User created successfully', user);
        } catch (error) {
            throw error;
        }
    }

    async updateUser(req, res) {
        try {
            const user = await userService.updateUser(req.params.id, req.body);
            return responseHandler(res, HTTP_STATUS.OK, 'User updated successfully', user);
        } catch (error) {
            throw error;
        }
    }

    async deleteUser(req, res) {
        try {
            await userService.deleteUser(req.params.id);
            return responseHandler(res, HTTP_STATUS.OK, 'User deleted successfully');
        } catch (error) {
            throw error;
        }
    }

    async getCompanySummaries(req, res) {
        try {
            if (req.user.role !== 'super_admin' && req.user.role !== 'sub_super_admin') {
                return responseHandler(res, HTTP_STATUS.FORBIDDEN, 'Access denied. Super Admin or Sub Super Admin only.');
            }
            const result = await userService.getCompanySummaries();
            return responseHandler(res, HTTP_STATUS.OK, 'Company summaries fetched successfully', result);
        } catch (error) {
            throw error;
        }
    }

    async createSubSuperAdmin(req, res) {
        try {
            if (req.user.role !== 'super_admin') {
                return responseHandler(res, HTTP_STATUS.FORBIDDEN, 'Access denied. Super Admin only.');
            }
            const user = await userService.createSubSuperAdmin(req.body);
            return responseHandler(res, HTTP_STATUS.CREATED, 'Sub Super Admin created successfully', user);
        } catch (error) {
            throw error;
        }
    }

    async getCompanyStaff(req, res) {
        try {
            const { companyId } = req.params;
            const userCompanyId = req.user.companyId;
            const isSuperAdmin = req.user.role === 'super_admin' || req.user.role === 'sub_super_admin';
            
            // If not super admin, they can only view staff of their own company
            if (!isSuperAdmin && userCompanyId !== companyId) {
                return responseHandler(res, HTTP_STATUS.FORBIDDEN, 'Access denied. You can only view your own company staff.');
            }
            
            const staff = await userService.getCompanyStaff(companyId);
            return responseHandler(res, HTTP_STATUS.OK, 'Company staff fetched successfully', staff);
        } catch (error) {
            throw error;
        }
    }

    async createSubAdmin(req, res) {
        try {
            const isAuthorized = req.user.role === 'admin' || req.user.role === 'super_admin';
            if (!isAuthorized) {
                return responseHandler(res, HTTP_STATUS.FORBIDDEN, 'Access denied. Only Company Admin or Super Admin can create sub-admins.');
            }
            
            const targetCompanyId = req.user.role === 'super_admin' ? (req.body.companyId || req.body.company_id || req.user.companyId) : req.user.companyId;
            const user = await userService.createSubAdmin(req.body, targetCompanyId);
            return responseHandler(res, HTTP_STATUS.CREATED, 'Sub Admin created successfully', user);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new UserController();

