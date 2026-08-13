const componentService = require('../../components/services/component.service');
const intelligenceService = require('../services/intelligence.service');
const responseHandler = require('../../../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

class IntelligenceController {
    async getRegister(req, res) {
        try {
            const { companyId, machineId } = req.query;
            const components = await componentService.getComponentRegister(companyId, machineId);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Intelligence register fetched', components);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async getDashboardStats(req, res) {
        try {
            const { companyId } = req.query;
            const stats = await componentService.getDashboardStats(companyId);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Dashboard stats fetched', stats);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async getFleetHeatMap(req, res) {
        try {
            const { companyId } = req.query;
            const data = await intelligenceService.getFleetHeatMap(companyId);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Fleet heatmap data fetched successfully', data);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async getFleetMonitoring(req, res) {
        try {
            const { companyId } = req.query;
            const data = await intelligenceService.getFleetMonitoring(companyId);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Fleet monitoring data fetched successfully', data);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }
}

module.exports = new IntelligenceController();
