const componentService = require('../services/component.service');
const responseHandler = require('../../../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

class ComponentController {
    async addComponent(req, res) {
        try {
            const component = await componentService.addComponent(req.body);
            return responseHandler(res, HTTP_STATUS.CREATED, true, 'Component registered successfully', component);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async updateComponent(req, res) {
        try {
            const component = await componentService.updateComponent(req.params.id, req.body);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Component updated successfully', component);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async getComponentRegister(req, res) {
        try {
            const { companyId } = req.query;
            const register = await componentService.getComponentRegister(companyId);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Component register fetched successfully', register);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async getDashboardStats(req, res) {
        try {
            const { companyId } = req.query;
            if (!companyId) throw new Error('companyId is required');
            const stats = await componentService.getDashboardStats(companyId);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Dashboard stats fetched successfully', stats);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async getCategories(req, res) {
        try {
            const categories = await componentService.getCategories();
            return responseHandler(res, HTTP_STATUS.OK, true, 'Categories fetched successfully', categories);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }
    async inspectComponent(req, res) {
        try {
            const userCompanyId = req.user.companyId;
            const userRole = req.user.role;
            const componentId = req.params.id;
            
            const component = await componentService.inspectComponent(componentId, req.body, userCompanyId, userRole);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Component inspected successfully', component);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async deleteComponent(req, res) {
        try {
            const component = await componentService.deleteComponent(req.params.id);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Component deleted successfully', component);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async getComponents(req, res) {
        try {
            const companyId = req.user.companyId;
            const components = await componentService.getComponents(req.query, companyId);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Components fetched successfully', components);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }
}

module.exports = new ComponentController();
