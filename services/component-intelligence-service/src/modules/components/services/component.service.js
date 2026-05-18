const componentRepository = require('../repositories/component.repository');

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
    async getComponentRegister(companyId) {
        const components = await componentRepository.findAll(companyId);
        
        return components.map(comp => {
            const hoursRun = comp.currentHours - comp.installHours;
            const lifeUsedPercent = Math.min(Math.round((hoursRun / comp.plannedLife) * 100), 100);
            const remainingHours = Math.max(comp.plannedLife - hoursRun, 0);

            // Intelligence Logic: Risk Assessment
            let riskStatus = 'Healthy';
            let riskDriver = 'Normal';

            if (comp.condition >= 5 || lifeUsedPercent >= 95) {
                riskStatus = 'Critical';
                riskDriver = comp.condition >= 5 ? 'Poor Condition' : 'End of Life';
            } else if (comp.condition >= 4 || lifeUsedPercent >= 85) {
                riskStatus = 'Warning';
                riskDriver = comp.condition >= 4 ? 'Poor Condition' : 'End of Life';
            }

            return {
                ...comp,
                intelligence: {
                    hoursRun,
                    lifeUsedPercent,
                    remainingHours,
                    riskStatus,
                    riskDriver
                }
            };
        });
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
}

module.exports = new ComponentService();
