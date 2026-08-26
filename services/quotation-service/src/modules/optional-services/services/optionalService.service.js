const optionalServiceRepository = require('../repositories/optionalService.repository');
const optionalServiceValidator = require('../validators/optionalService.validator');

class OptionalServiceService {
    async getPublicServices(filter = {}) {
        return optionalServiceRepository.findAll({ ...filter, isActive: true });
    }

    async getAdminServices(filter = {}) {
        return optionalServiceRepository.findAll(filter);
    }

    async getServiceById(id) {
        const service = await optionalServiceRepository.findById(id);
        if (!service) throw new Error('Optional service not found');
        return service;
    }

    async createService(data, user) {
        // 1. Separate validator handles all field rules & duplicate checks
        const validated = await optionalServiceValidator.validateCreate(data);

        // 2. Save purely minimal data (no code generation)
        return optionalServiceRepository.create({
            ...validated,
            createdBy: user?.id || null
        });
    }

    async updateService(id, data) {
        await this.getServiceById(id);
        const validated = await optionalServiceValidator.validateUpdate(id, data);
        return optionalServiceRepository.update(id, validated);
    }

    async toggleServiceStatus(id) {
        return optionalServiceRepository.toggleActive(id);
    }

    async deleteService(id) {
        await this.getServiceById(id);
        return optionalServiceRepository.delete(id);
    }
}

module.exports = new OptionalServiceService();
