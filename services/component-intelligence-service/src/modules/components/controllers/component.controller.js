const componentService = require('../services/component.service');
const responseHandler = require('../../../utils/responseHandler');

class ComponentController {
    async addComponent(req, res) {
        try {
            const component = await componentService.addComponent(req.body);
            return responseHandler(res, 201, true, 'Component registered successfully', component);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }

    async updateComponent(req, res) {
        try {
            const component = await componentService.updateComponent(req.params.id, req.body);
            return responseHandler(res, 200, true, 'Component updated successfully', component);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }

    async getComponentRegister(req, res) {
        try {
            const { companyId } = req.query;
            const register = await componentService.getComponentRegister(companyId);
            return responseHandler(res, 200, true, 'Component register fetched successfully', register);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }

    async getDashboardStats(req, res) {
        try {
            const { companyId } = req.query;
            if (!companyId) throw new Error('companyId is required');
            const stats = await componentService.getDashboardStats(companyId);
            return responseHandler(res, 200, true, 'Dashboard stats fetched successfully', stats);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }

    async getCategories(req, res) {
        try {
            const categories = await componentService.getCategories();
            return responseHandler(res, 200, true, 'Categories fetched successfully', categories);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }
    async deleteComponent(req, res) {
        try {
            const component = await componentService.deleteComponent(req.params.id);
            return responseHandler(res, 200, true, 'Component deleted successfully', component);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }
}

module.exports = new ComponentController();
