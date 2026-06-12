const maintenanceService = require('../services/maintenance.service');
const responseHandler = require('../../../utils/responseHandler');

class MaintenanceController {
    async addLog(req, res) {
        try {
            // Bind the logged-in user's companyId to the maintenance data
            req.body.companyId = req.user.companyId;
            
            const log = await maintenanceService.createLog(req.body);
            return responseHandler(res, 201, true, 'Maintenance log created successfully', log);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }

    async getLogs(req, res) {
        try {
            const companyId = req.user.companyId;
            const logs = await maintenanceService.getLogs(companyId);
            return responseHandler(res, 200, true, 'Maintenance logs fetched successfully', logs);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }

    async updateLog(req, res) {
        try {
            const log = await maintenanceService.updateLog(req.params.id, req.body);
            return responseHandler(res, 200, true, 'Maintenance log updated successfully', log);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }

    async deleteLog(req, res) {
        try {
            const log = await maintenanceService.deleteLog(req.params.id);
            return responseHandler(res, 200, true, 'Maintenance log deleted successfully', log);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }
}

module.exports = new MaintenanceController();
