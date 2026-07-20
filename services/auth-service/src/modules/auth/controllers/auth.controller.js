const authService = require('../services/auth.service');
const responseHandler = require('../../../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

class AuthController {
    async register(req, res) {
        try {
            const result = await authService.register(req.body);
            return responseHandler(res, HTTP_STATUS.CREATED, 'Registration successful', result);
        } catch (error) {
            throw error;
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            return responseHandler(res, HTTP_STATUS.OK, 'Login successful', result);
        } catch (error) {
            throw error;
        }
    }

    async getMe(req, res) {
        try {
            return responseHandler(res, HTTP_STATUS.OK, 'User profile fetched', req.user);
        } catch (error) {
            throw error;
        }
    }

    async getDashboard(req, res) {
        try {
            const userService = require('../../user/services/user.service');
            const stats = await userService.getDashboardStats(req.user.companyId, req.user.role);
            
            return responseHandler(res, HTTP_STATUS.OK, 'Dashboard data fetched', stats);
        } catch (error) {
            throw error;
        }
    }

    async getSalesTrends(req, res) {
        try {
            const userService = require('../../user/services/user.service');
            const data = await userService.getSalesTrends(req.query.period || 'daily');
            return responseHandler(res, HTTP_STATUS.OK, data);
        } catch (error) {
            throw error;
        }
    }

    async getDashboardMetrics(req, res) {
        try {
            const userService = require('../../user/services/user.service');
            const data = await userService.getDashboardMetrics(req.user.companyId, req.user.role);
            return responseHandler(res, HTTP_STATUS.OK, 'Dashboard metrics fetched', data);
        } catch (error) {
            throw error;
        }
    }

    async getDashboardPlanDistribution(req, res) {
        try {
            const userService = require('../../user/services/user.service');
            const data = await userService.getDashboardPlanDistribution(req.user.role);
            return responseHandler(res, HTTP_STATUS.OK, 'Plan distribution fetched', data);
        } catch (error) {
            throw error;
        }
    }

    async getDashboardRecentActivity(req, res) {
        try {
            const userService = require('../../user/services/user.service');
            const data = await userService.getDashboardRecentActivity(req.user.role);
            return responseHandler(res, HTTP_STATUS.OK, 'Recent activity fetched', data);
        } catch (error) {
            throw error;
        }
    }

    async getDashboardMachineStatus(req, res) {
        try {
            const userService = require('../../user/services/user.service');
            const data = await userService.getDashboardMachineStatus(req.user.role);
            return responseHandler(res, HTTP_STATUS.OK, 'Machine status fetched', data);
        } catch (error) {
            throw error;
        }
    }

    async getDashboardAlertsSummary(req, res) {
        try {
            const userService = require('../../user/services/user.service');
            const data = await userService.getDashboardAlertsSummary(req.user.role);
            return responseHandler(res, HTTP_STATUS.OK, 'Alerts summary fetched', data);
        } catch (error) {
            throw error;
        }
    }

    async sendAfternoonReport(req, res) {
        try {
            const userService = require('../../user/services/user.service');
            const data = await userService.sendAfternoonReport();
            return responseHandler(res, HTTP_STATUS.OK, 'Afternoon progress report sent successfully', data);
        } catch (error) {
            throw error;
        }
    }

    async getDashboardRolesActivity(req, res) {
        try {
            const userService = require('../../user/services/user.service');
            const data = await userService.getDashboardRolesActivity(req.user.role);
            return responseHandler(res, HTTP_STATUS.OK, 'Roles activity history fetched successfully', data);
        } catch (error) {
            throw error;
        }
    }

    async getDashboardRoleDetails(req, res) {
        try {
            const { id } = req.params;
            const userService = require('../../user/services/user.service');
            const data = await userService.getDashboardRoleDetails(id, req.user.role);
            return responseHandler(res, HTTP_STATUS.OK, 'Role details fetched successfully', data);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new AuthController();

