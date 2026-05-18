const componentService = require('../../components/services/component.service');
const intelligenceService = require('../services/intelligence.service');
const responseHandler = require('../../../utils/responseHandler');

class IntelligenceController {
    async getRegister(req, res) {
        try {
            const { companyId } = req.query;
            if (!companyId) throw new Error('companyId is required');
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
            if (!companyId) throw new Error('companyId is required');
            const stats = await componentService.getDashboardStats(companyId);
            return responseHandler(res, 200, true, 'Dashboard stats fetched', stats);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }
}

module.exports = new IntelligenceController();
