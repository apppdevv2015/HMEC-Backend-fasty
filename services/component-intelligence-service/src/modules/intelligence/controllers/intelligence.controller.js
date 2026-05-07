const intelligenceService = require('../services/intelligence.service');

class IntelligenceController {
    async runAnalysis(req, res) {
        try {
            const { machineId } = req.params;
            const result = await intelligenceService.analyzeMachine(machineId);
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getStatus(req, res) {
        res.json({ message: "Intelligence Engine is Ready" });
    }
}

module.exports = new IntelligenceController();
