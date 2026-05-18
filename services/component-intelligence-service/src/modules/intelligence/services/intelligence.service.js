class IntelligenceService {
    calculateMetrics(comp) {
        const hoursRun = comp.currentHours - comp.installHours;
        const lifeUsedPercent = Math.min(Math.round((hoursRun / comp.plannedLife) * 100), 100);
        const remainingHours = Math.max(comp.plannedLife - hoursRun, 0);
        let riskStatus = 'Healthy';
        let riskDriver = 'Normal';
        if (comp.condition >= 5 || lifeUsedPercent >= 95) {
            riskStatus = 'Critical';
            riskDriver = comp.condition >= 5 ? 'Poor Condition' : 'End of Life';
        } else if (comp.condition >= 4 || lifeUsedPercent >= 85) {
            riskStatus = 'Warning';
            riskDriver = comp.condition >= 4 ? 'Poor Condition' : 'End of Life';
        }
        return { hoursRun, lifeUsedPercent, remainingHours, riskStatus, riskDriver };
    }
    processRegister(components) {
        return components.map(comp => ({ ...comp, intelligence: this.calculateMetrics(comp) }));
    }
}
module.exports = new IntelligenceService();
