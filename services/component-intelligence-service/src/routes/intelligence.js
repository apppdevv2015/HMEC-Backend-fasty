const express = require('express');
const router = express.Router();
const DecisionEngine = require('../modules/decision-engine');

module.exports = (pool) => {
    const engine = new DecisionEngine(pool);

    /**
     * POST /api/intelligence/analyze
     * Manually trigger a full system analysis for a company
     */
    router.post('/analyze', async (req, res) => {
        const { companyId } = req.body;
        if (!companyId) return res.status(400).json({ error: 'companyId is required' });

        try {
            const results = await engine.performFullAnalysis(companyId);
            res.json(results);
        } catch (err) {
            console.error('[INTELLIGENCE-API] Analysis failed:', err);
            res.status(500).json({ error: err.message });
        }
    });

    /**
     * GET /api/intelligence/recommendations
     * Fetch all AI-driven recommendations with cost impact
     */
    router.get('/recommendations', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT r.*, m.name as machine_name, c.name as component_name 
                FROM recommendations r
                LEFT JOIN machines m ON r.machine_id = m.id
                LEFT JOIN components c ON r.component_id = c.id
                ORDER BY r.priority DESC, r.created_at DESC
            `);
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    /**
     * GET /api/intelligence/predictions
     * Fetch all component failure predictions
     */
    router.get('/predictions', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT fp.*, c.name as component_name, m.name as machine_name
                FROM failure_predictions fp
                JOIN components c ON fp.component_id = c.id
                JOIN machines m ON c.machine_id = m.id
                ORDER BY fp.predicted_failure_date ASC
            `);
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    /**
     * GET /api/intelligence/machine-health/:machineId
     * Get real-time MHI (Machine Health Index)
     */
    router.get('/machine-health/:machineId', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT * FROM machine_scores 
                WHERE machine_id = $1 
                ORDER BY calculated_at DESC LIMIT 1
            `, [req.params.machineId]);
            
            if (result.rowCount === 0) return res.status(404).json({ error: 'No health data for this machine' });
            res.json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
