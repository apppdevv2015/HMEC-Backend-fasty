const { calculateComponentScore, calculateMHI, getStatusFromScore } = require('../../../../packages/shared');

/**
 * Health Scoring Module
 * Coordinates the calculation of health scores for different components.
 */
class HealthScoringModule {
    
    /**
     * Updates the health score for a specific component.
     * @param {string} componentType 
     * @param {Object} sensorData 
     * @returns {Object} Result with score and status
     */
    static processComponentUpdate(componentType, sensorData) {
        // Define weights based on component type
        const weights = this.getWeightsForComponent(componentType);
        
        const score = calculateComponentScore(sensorData, weights);
        const status = getStatusFromScore(score);
        
        return {
            componentType,
            score,
            status: status.label,
            color: status.color,
            timestamp: new Date()
        };
    }

    /**
     * Get weights for scoring parameters based on mining engineering standards
     */
    static getWeightsForComponent(type) {
        const defaultWeights = {
            'engine': { temperature: 0.4, fuel_pressure: 0.3, vibration: 0.3 },
            'tyre': { pressure: 0.5, temperature: 0.3, tread_wear: 0.2 },
            'transmission': { oil_temp: 0.4, shift_delay: 0.3, vibration: 0.3 },
            'hydraulic': { pressure: 0.4, cycle_time: 0.4, fluid_temp: 0.2 }
        };
        
        return defaultWeights[type] || { usage: 1.0 };
    }
}

module.exports = HealthScoringModule;
