const componentRepository = require('../repositories/component.repository');
const intelligenceService = require('../../intelligence/services/intelligence.service');

class ComponentService {
    /**
     * Register a new component to a machine
     */
    async addComponent(data) {
        if (data.plannedLife <= 0) data.plannedLife = 1; // Prevent division by zero
        return await componentRepository.create(data);
    }

    /**
     * Get the full component register with calculated intelligence metrics
     * This logic powers the dashboard table view
     */
    async getComponentRegister(companyId, machineId) {
        const components = await componentRepository.findAll(companyId, machineId);
        return intelligenceService.processRegister(components);
    }

    /**
     * Update component details (Edit functionality)
     */
    async updateComponent(id, data) {
        return await componentRepository.update(id, data);
    }

    /**
     * Get summary statistics for the dashboard cards
     */
    async getDashboardStats(companyId) {
        const components = await this.getComponentRegister(companyId);
        
        return {
            totalComponents: components.length,
            critical: components.filter(c => c.intelligence.riskStatus === 'Critical').length,
            warning: components.filter(c => c.intelligence.riskStatus === 'Warning').length,
            healthy: components.filter(c => c.intelligence.riskStatus === 'Healthy').length,
            totalReplacementCost: components.reduce((sum, c) => sum + Number(c.replacementCost), 0)
        };
    }

    /**
     * Get all active component categories
     */
    async getCategories() {
        return await componentRepository.getCategories();
    }
    /**
     * Inspect component - restricted to staff/engineers belonging to the same company
     */
    async inspectComponent(id, data, companyId, role) {
        // 1. Fetch component with machine details
        const component = await componentRepository.findById(id);
        if (!component) {
            throw new Error('Component not found');
        }

        // 2. Multi-tenant isolation guardrail: Check if component belongs to the engineer's company
        // Super Admins and Sub Super Admins can bypass this check
        if (role !== 'super_admin' && role !== 'sub_super_admin' && component.machine.companyId !== companyId) {
            throw new Error('Access denied: You are not authorized to inspect this component.');
        }

        // 3. Perform update (only operational fields currentHours and condition allowed)
        const updateData = {
            currentHours: data.currentHours,
            condition: data.condition
        };

        return await componentRepository.update(id, updateData);
    }

    /**
     * Delete an existing component by its ID
     */
    async deleteComponent(id) {
        return await componentRepository.delete(id);
    }

    /**
     * Fetch components filtered by machineId or companyId with intelligence metrics
     */
    async getComponents(query, companyId) {
        if (query.machineId) {
            const components = await componentRepository.findByMachineId(query.machineId);
            return intelligenceService.processRegister(components);
        }
        const components = await componentRepository.findAll(companyId);
        return intelligenceService.processRegister(components);
    }
}

module.exports = new ComponentService();
