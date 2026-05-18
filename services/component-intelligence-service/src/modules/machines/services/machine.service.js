const machineRepository = require('../repositories/machine.repository');

class MachineService {
    async addMachine(data) {
        // 1. Check active subscription
        const subscription = await machineRepository.getCompanyActiveSubscription(data.companyId);
        if (!subscription) {
            throw new Error("No active subscription found. Please subscribe to a plan to add machines.");
        }

        // 2. Check machine limits
        const machineLimit = subscription.plan.machineLimit;
        const currentMachinesCount = await machineRepository.countMachinesByCompany(data.companyId);

        if (currentMachinesCount >= machineLimit) {
            throw new Error(`Subscription limit reached. Your current plan allows a maximum of ${machineLimit} machines. Please upgrade your plan to add more.`);
        }

        // 3. Create machine if limits are valid
        const dbData = {
            name: data.name,
            model: data.model,
            serialNumber: data.serialNumber,
            companyId: data.companyId
        };
        return await machineRepository.create(dbData);
    }

    async getMachines(companyId) {
        return await machineRepository.findAll(companyId);
    }

    async getMachineById(id) {
        return await machineRepository.findById(id);
    }

    async updateMachine(id, data) {
        const dbData = {};
        if (data.name !== undefined) dbData.name = data.name;
        if (data.model !== undefined) dbData.model = data.model;
        if (data.serialNumber !== undefined) dbData.serialNumber = data.serialNumber;
        
        return await machineRepository.update(id, dbData);
    }

    async deleteMachine(id) {
        return await machineRepository.delete(id);
    }
}

module.exports = new MachineService();
