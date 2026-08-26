const optionalServiceRepository = require('../repositories/optionalService.repository');

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
        if (!data.name || !data.name.trim()) {
            throw new Error('Service name is required');
        }

        // Generate clean code if not provided
        let code = data.code ? data.code.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_') : null;
        if (!code) {
            code = data.name.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').slice(0, 30) + '_' + Date.now().toString().slice(-4);
        }

        const existing = await optionalServiceRepository.findByCode(code);
        if (existing) {
            code = `${code}_${Date.now().toString().slice(-4)}`;
        }

        return optionalServiceRepository.create({
            ...data,
            code,
            createdBy: user?.id || null
        });
    }

    async updateService(id, data) {
        await this.getServiceById(id);
        return optionalServiceRepository.update(id, data);
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
