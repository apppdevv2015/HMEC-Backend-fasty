const optionalServiceService = require('../services/optionalService.service');
const responseHandler = require('../../../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

class OptionalServiceController {
    async getPublicServices(req, res) {
        try {
            const { search, page, limit } = req.query;
            const result = await optionalServiceService.getPublicServices({ search, page, limit });
            return responseHandler(
                res, 
                HTTP_STATUS.OK, 
                true, 
                'Optional services fetched successfully', 
                result.data,
                { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages }
            );
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async getAdminServices(req, res) {
        try {
            const { search, isActive, page, limit } = req.query;
            const filter = { search, page, limit };
            if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;
            
            const result = await optionalServiceService.getAdminServices(filter);
            return responseHandler(
                res, 
                HTTP_STATUS.OK, 
                true, 
                'Admin optional services fetched successfully', 
                result.data,
                { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages }
            );
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async getServiceById(req, res) {
        try {
            const { id } = req.params;
            const service = await optionalServiceService.getServiceById(id);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Service details fetched successfully', service);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.NOT_FOUND, false, error.message);
        }
    }

    async createService(req, res) {
        try {
            const service = await optionalServiceService.createService(req.body, req.user);
            return responseHandler(res, HTTP_STATUS.CREATED, true, 'Optional service created successfully', service);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async updateService(req, res) {
        try {
            const { id } = req.params;
            const service = await optionalServiceService.updateService(id, req.body);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Optional service updated successfully', service);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async toggleStatus(req, res) {
        try {
            const { id } = req.params;
            const service = await optionalServiceService.toggleServiceStatus(id);
            return responseHandler(res, HTTP_STATUS.OK, true, `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`, service);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async deleteService(req, res) {
        try {
            const { id } = req.params;
            await optionalServiceService.deleteService(id);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Optional service deleted successfully');
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }
}

module.exports = new OptionalServiceController();
