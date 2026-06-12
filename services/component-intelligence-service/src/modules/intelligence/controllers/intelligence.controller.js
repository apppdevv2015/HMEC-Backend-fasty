const componentService = require('../../components/services/component.service');
const intelligenceService = require('../services/intelligence.service');
const responseHandler = require('../../../utils/responseHandler');

class IntelligenceController {
    async getRegister(req, res) {
        try {
            const { companyId } = req.query;
            const components = await componentService.getComponentRegister(companyId);
            const processed = intelligenceService.processRegister(components);
            return responseHandler(res, 200, true, 'Intelligence register fetched', processed);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }

    async getDashboardStats(req, res) {
        try {
            const { companyId } = req.query;
            const stats = await componentService.getDashboardStats(companyId);
            return responseHandler(res, 200, true, 'Dashboard stats fetched', stats);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }

    async getFleetHeatMap(req, res) {
        try {
            const { companyId } = req.query;
            const data = await intelligenceService.getFleetHeatMap(companyId);
            return responseHandler(res, 200, true, 'Fleet heatmap data fetched successfully', data);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }
}

module.exports = new IntelligenceController();
