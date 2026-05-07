const intelligenceRepository = require('../repositories/intelligence.repository');
const decisionEngine = require('../../../modules/decision-engine'); // Assuming old path or refactor it too

class IntelligenceService {
    async analyzeMachine(machineId) {
        const components = await intelligenceRepository.getComponentHealth(machineId);
        const prediction = await intelligenceRepository.getMachinePredictions(machineId);
        
        // Use Decision Engine to process
        const recommendation = decisionEngine.generateRecommendation(components, prediction);
        
        return {
            machineId,
            health_score: 85, // Mock aggregate
            recommendation
        };
    }
}

module.exports = new IntelligenceService();
