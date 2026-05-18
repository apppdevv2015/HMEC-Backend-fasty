const machineRepository = require('../repositories/machine.repository');
const responseHandler = require('../../../utils/responseHandler');

class MachineController {
    async addMachine(req, res) {
        try {
            const machine = await machineRepository.create(req.body);
            return responseHandler(res, 201, true, 'Machine registered successfully', machine);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }

    async getMachines(req, res) {
        try {
            const { companyId } = req.query;
            const machines = await machineRepository.findAll(companyId);
            return responseHandler(res, 200, true, 'Machines fetched successfully', machines);
        } catch (error) {
            return responseHandler(res, 400, false, error.message);
        }
    }
}

module.exports = new MachineController();
