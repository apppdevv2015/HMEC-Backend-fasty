const { calculateComponentScore, calculateMHI, getStatusFromScore } = require('../../../../packages/shared/scoring');
const { COMPONENT_TYPES } = require('../../../../packages/shared/constants');

class DecisionEngine {
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Performs a full system analysis for all machines and components.
     * This updates scores, generates recommendations and predictions.
     */
    async performFullAnalysis(companyId) {
        console.log(`[DecisionEngine] Starting full analysis for company: ${companyId}`);
        
        // 1. Fetch all machines for the company
        const machines = await this.pool.query('SELECT id, name FROM machines WHERE company_id = $1', [companyId]);
        
        for (const machine of machines.rows) {
            await this.analyzeMachine(machine.id);
        }
        
        return { message: 'Analysis complete', machinesAnalyzed: machines.rowCount };
    }

    /**
     * Analyzes a single machine and all its components
     */
    async analyzeMachine(machineId) {
        const components = await this.pool.query('SELECT id, type, name, current_life_hours, expected_life_hours FROM components WHERE machine_id = $1', [machineId]);
        
        let componentScores = [];

        for (const component of components.rows) {
            const scoreData = await this.analyzeComponent(component);
            componentScores.push({
                type: component.type,
                score: scoreData.score,
                weight: this.getComponentWeight(component.type)
            });

            // Update Component Score in DB
            await this.pool.query(
                'INSERT INTO component_scores (component_id, score, risk_level) VALUES ($1, $2, $3)',
                [component.id, scoreData.score, getStatusFromScore(scoreData.score).label]
            );

            // Generate Recommendation if health is low
            if (scoreData.score < 70 || (component.current_life_hours / component.expected_life_hours) > 0.85) {
                await this.generateRecommendation(component, scoreData.score);
            }

            // Generate Failure Prediction
            await this.generateFailurePrediction(component, scoreData.score);
        }

        // Calculate and Save Machine Health Index (MHI)
        const mhi = calculateMHI(componentScores);
        await this.pool.query(
            'INSERT INTO machine_scores (machine_id, score) VALUES ($1, $2)',
            [machineId, Math.round(mhi)]
        );
    }

    /**
     * Analyzes component logs to determine a health score
     */
    async analyzeComponent(component) {
        // Fetch last 10 logs for this component
        const logs = await this.pool.query(
            'SELECT data FROM component_logs WHERE component_id = $1 ORDER BY timestamp DESC LIMIT 10',
            [component.id]
        );

        if (logs.rowCount === 0) return { score: 100 }; // No data, assume healthy or new

        // Simple weighted averaging of the "health_impact" parameter if it exists
        // In a real system, we would parse sensor data like temperature, pressure, vibrations.
        let totalImpact = 0;
        let validLogs = 0;

        logs.rows.forEach(log => {
            if (log.data && log.data.health_impact !== undefined) {
                totalImpact += log.data.health_impact;
                validLogs++;
            }
        });

        const averageImpact = validLogs > 0 ? totalImpact / validLogs : 0;
        
        // Use shared scoring logic
        const score = calculateComponentScore({ impact: averageImpact }, { impact: 1.0 });
        
        return { score: Math.round(score) };
    }

    /**
     * Creates an actionable recommendation based on health and life data
     */
    async generateRecommendation(component, score) {
        let action = 'Inspect';
        let priority = 'Medium';
        let rationale = '';
        let estSaving = 0;

        const lifeRatio = component.current_life_hours / component.expected_life_hours;

        if (score < 40) {
            action = 'Immediate Replacement';
            priority = 'Critical';
            rationale = `Component health is critical (${score}%). High risk of catastrophic failure.`;
            estSaving = component.expected_life_hours * 0.15 * 50; // Simple formula: 15% life extension value
        } else if (score < 70) {
            action = 'Scheduled Rebuild';
            priority = 'High';
            rationale = `Component showing signs of accelerated wear. Proactive rebuild recommended to avoid downtime.`;
            estSaving = 5000; // Fixed estimate for demo
        } else if (lifeRatio > 0.85) {
            action = 'Planned Replacement';
            priority = 'Medium';
            rationale = `Component has reached ${Math.round(lifeRatio * 100)}% of its design life.`;
            estSaving = 2000;
        } else {
            return; // No recommendation needed
        }

        // Get company_id for this component
        const machine = await this.pool.query('SELECT company_id, id as machine_id FROM machines WHERE id = (SELECT machine_id FROM components WHERE id = $1)', [component.id]);
        
        if (machine.rowCount === 0) return;

        // Save recommendation (Avoiding duplicates for same component/status)
        await this.pool.query(`
            INSERT INTO recommendations (company_id, machine_id, component_id, action_type, recommendation_text, rationale, estimated_saving, priority)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT DO NOTHING
        `, [
            machine.rows[0].company_id,
            machine.rows[0].machine_id,
            component.id,
            action,
            `Perform ${action} on ${component.name}`,
            rationale,
            estSaving,
            priority
        ]);
    }

    /**
     * Calculates RUL (Remaining Useful Life) and failure dates
     */
    async generateFailurePrediction(component, score) {
        const remainingHours = component.expected_life_hours - component.current_life_hours;
        
        // Health-adjusted RUL: If score is 50%, we expect it to last only 50% of its remaining time
        const predictedRUL = Math.max(0, Math.round(remainingHours * (score / 100)));
        
        // Estimate failure date (Assumes 10 hours of operation per day)
        const daysToFailure = predictedRUL / 10;
        const failureDate = new Date();
        failureDate.setDate(failureDate.getDate() + daysToFailure);

        await this.pool.query(`
            INSERT INTO failure_predictions (component_id, predicted_remaining_life_hours, predicted_failure_date, confidence_score, factors)
            VALUES ($1, $2, $3, $4, $5)
        `, [
            component.id,
            predictedRUL,
            failureDate,
            score, // Confidence is tied to health score for now
            JSON.stringify({ 
                health_score: score, 
                current_life: component.current_life_hours,
                wear_rate: 'normal' 
            })
        ]);
    }

    getComponentWeight(type) {
        const weights = {
            [COMPONENT_TYPES.ENGINE]: 2.0,
            [COMPONENT_TYPES.TRANSMISSION]: 1.5,
            [COMPONENT_TYPES.HYDRAULIC]: 1.0,
            [COMPONENT_TYPES.TYRE]: 0.5
        };
        return weights[type] || 1.0;
    }
}

module.exports = DecisionEngine;
