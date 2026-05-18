const machineRepository = require('../repositories/machine.repository');

class MachineService {
    async addMachine(data) {
        return await machineRepository.create(data);
    }

    async getMachines(companyId) {
        return await machineRepository.findAll(companyId);
    }

    async getMachineById(id) {
        return await machineRepository.findById(id);
    }
}

module.exports = new MachineService();
