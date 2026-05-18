const authService = require('../services/auth.service');
const responseHandler = require('../../../utils/responseHandler');

class AuthController {
    async register(req, res, next) {
        try {
            const result = await authService.register(req.body);
            return responseHandler(res, 201, 'Registration successful', result);
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            return responseHandler(res, 200, 'Login successful', result);
        } catch (error) {
            next(error);
        }
    }

    async getMe(req, res, next) {
        try {
            return responseHandler(res, 200, 'User profile fetched', req.user);
        } catch (error) {
            next(error);
        }
    }

    async getDashboard(req, res, next) {
        try {
            const userService = require('../../user/services/user.service');
            const stats = await userService.getDashboardStats(req.user.companyId, req.user.role);
            
            return responseHandler(res, 200, 'Dashboard data fetched', stats);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
