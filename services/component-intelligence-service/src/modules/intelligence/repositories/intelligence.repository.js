const db = require('../../../database');

class IntelligenceRepository {
    async getComponentHealth(machineId) {
        return db('components')
            .where({ machine_id: machineId })
            .select('id', 'name', 'health_score', 'status');
    }

    async getMachinePredictions(machineId) {
        // Mock logic for now, in real it would query prediction models
        return db('machines')
            .where({ id: machineId })
            .select('id', 'name', 'remaining_useful_life');
    }

    async saveRecommendation(data) {
        return db('recommendations').insert(data).returning('*');
    }
}

module.exports = new IntelligenceRepository();
