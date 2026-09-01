const quotationPlanRepository = require('../repositories/quotationPlan.repository');

class QuotationPlanService {
    async getPublicPlans({ search } = {}) {
        return quotationPlanRepository.findAll({ isActive: true, search });
    }

    async getAllPlansForAdmin({ search, isActive } = {}) {
        return quotationPlanRepository.findAll({ isActive, search });
    }

    async getPlanById(id) {
        const plan = await quotationPlanRepository.findById(id);
        if (!plan) {
            const err = new Error(`Quotation plan with ID ${id} not found`);
            err.statusCode = 404;
            throw err;
        }
        return plan;
    }

    async createPlan(data) {
        if (!data.name || !data.name.trim()) {
            const err = new Error('Plan name is required');
            err.statusCode = 400;
            throw err;
        }

        const existing = await quotationPlanRepository.findByName(data.name.trim());
        if (existing) {
            const err = new Error(`A quotation plan with name "${data.name.trim()}" already exists`);
            err.statusCode = 400;
            throw err;
        }

        return quotationPlanRepository.create(data);
    }

    async updatePlan(id, data) {
        await this.getPlanById(id);

        if (data.name && data.name.trim()) {
            const existing = await quotationPlanRepository.findByName(data.name.trim());
            if (existing && existing.id !== id) {
                const err = new Error(`A quotation plan with name "${data.name.trim()}" already exists`);
                err.statusCode = 400;
                throw err;
            }
        }

        return quotationPlanRepository.update(id, data);
    }

    async togglePlanActive(id) {
        const updated = await quotationPlanRepository.toggleActive(id);
        if (!updated) {
            const err = new Error(`Quotation plan with ID ${id} not found`);
            err.statusCode = 404;
            throw err;
        }
        return updated;
    }

    async deletePlan(id) {
        await this.getPlanById(id);
        return quotationPlanRepository.delete(id);
    }
}

module.exports = new QuotationPlanService();
