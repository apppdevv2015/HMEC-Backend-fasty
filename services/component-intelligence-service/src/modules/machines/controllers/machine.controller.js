const machineService = require('../services/machine.service');
const responseHandler = require('../../../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

class MachineController {
    async addMachine(req, res) {
        try {
            // Securely bind the logged-in user's companyId to the machine data
            req.body.companyId = req.user.companyId;
            
            const machine = await machineService.addMachine(req.body);
            return responseHandler(res, HTTP_STATUS.CREATED, true, 'Machine registered successfully', machine);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async getMachines(req, res) {
        try {
            const { companyId, page, limit, search } = req.query;
            if (page || limit || search) {
                const paginatedResult = await machineService.getPaginatedMachines({
                    companyId,
                    page: Number(page) || 1,
                    limit: Number(limit) || 10,
                    search: search || ''
                });
                return responseHandler(res, HTTP_STATUS.OK, true, 'Machines fetched successfully with pagination', paginatedResult);
            }
            const machines = await machineService.getMachines(companyId);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Machines fetched successfully', machines);
        } catch (error) {
            console.error('[GET MACHINES ERROR]:', error);
            return responseHandler(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message || 'Failed to fetch machines');
        }
    }

    async updateMachine(req, res) {
        try {
            const machine = await machineService.updateMachine(req.params.id, req.body);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Machine updated successfully', machine);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async deleteMachine(req, res) {
        try {
            const machine = await machineService.deleteMachine(req.params.id);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Machine deleted successfully', machine);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async getCategories(req, res) {
        try {
            const { companyId } = req.query;
            const categories = await machineService.getCategories(companyId);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Machine categories fetched successfully', categories);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async createCategory(req, res) {
        try {
            const category = await machineService.createCategory(req.body);
            return responseHandler(res, HTTP_STATUS.CREATED, true, 'Machine category created successfully', category);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async deleteCategory(req, res) {
        try {
            const category = await machineService.deleteCategory(req.params.id);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Machine category deleted successfully', category);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }
}

module.exports = new MachineController();
