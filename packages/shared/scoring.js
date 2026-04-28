/**
 * HME Intelligence System - Core Scoring Engine
 * Encapsulates the logic for calculating Component Health Scores and Machine Health Index (MHI).
 */

const { HEALTH_STATUS } = require('./constants');

/**
 * Calculates a component health score based on weighted parameters.
 * @param {Object} parameters - Parameters like temperature, pressure, wear, etc.
 * @param {Object} weights - Weights for each parameter.
 * @returns {number} Score from 0 to 100.
 */
function calculateComponentScore(parameters, weights) {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const key in weights) {
        if (parameters[key] !== undefined) {
            // Normalize parameter to 0-100 scale (Assuming parameters are passed as 0-100 impact)
            // In a real system, we'd have specific normalization logic per parameter.
            weightedSum += parameters[key] * weights[key];
            totalWeight += weights[key];
        }
    }

    if (totalWeight === 0) return 100; // Default to healthy if no data

    const rawScore = weightedSum / totalWeight;
    // We want 100 to be perfect health, so we subtract the "damage/impact" from 100 if parameters represent stress
    return Math.max(0, Math.min(100, 100 - rawScore));
}

/**
 * Calculates the Machine Health Index (MHI) by aggregating component scores.
 * @param {Array<Object>} componentScores - List of { type: string, score: number, weight: number }
 * @returns {number} MHI score from 0 to 100.
 */
function calculateMHI(componentScores) {
    if (!componentScores || componentScores.length === 0) return 100;

    let weightedScoreSum = 0;
    let totalWeight = 0;

    componentScores.forEach(comp => {
        const weight = comp.weight || 1.0;
        weightedScoreSum += comp.score * weight;
        totalWeight += weight;
    });

    return Math.max(0, Math.min(100, weightedScoreSum / totalWeight));
}

/**
 * Determines the status label based on a score.
 * @param {number} score 
 * @returns {Object} Health status object
 */
function getStatusFromScore(score) {
    if (score >= HEALTH_STATUS.HEALTHY.min) return HEALTH_STATUS.HEALTHY;
    if (score >= HEALTH_STATUS.DEGRADING.min) return HEALTH_STATUS.DEGRADING;
    if (score >= HEALTH_STATUS.WARNING.min) return HEALTH_STATUS.WARNING;
    return HEALTH_STATUS.CRITICAL;
}

module.exports = {
    calculateComponentScore,
    calculateMHI,
    getStatusFromScore
};
