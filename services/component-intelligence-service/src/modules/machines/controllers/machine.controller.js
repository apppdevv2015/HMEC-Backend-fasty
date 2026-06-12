const machineService = require('../services/machine.service');
const responseHandler = require('../../../utils/responseHandler');

class MachineController {
    async addMachine(req, res) {
        try {
            // Securely bind the logged-in user's companyId to the machine data
            req.body.companyId = req.user.companyId;
            
            const machine = await machineService.addMachine(req.body);
            return responseHandler(res, 201, true, 'Machine registered successfully', machine);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }

    async getMachines(req, res) {
        try {
            const { companyId } = req.query;
            const machines = await machineService.getMachines(companyId);
            return responseHandler(res, 200, true, 'Machines fetched successfully', machines);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }

    async updateMachine(req, res) {
        try {
            const machine = await machineService.updateMachine(req.params.id, req.body);
            return responseHandler(res, 200, true, 'Machine updated successfully', machine);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }

    async deleteMachine(req, res) {
        try {
            const machine = await machineService.deleteMachine(req.params.id);
            return responseHandler(res, 200, true, 'Machine deleted successfully', machine);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }
}

module.exports = new MachineController();
