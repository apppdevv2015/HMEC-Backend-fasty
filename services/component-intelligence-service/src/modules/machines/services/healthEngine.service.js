/**
 * Health Engine Calculator for Heavy Mining Equipment (HME)
 * Evaluates Operating Parameters & Inspection Checklists against OEM Safe Limits
 * (safeMin, safeMax) to compute Component Health Score (0-100) and Status (Healthy, Warning, Critical).
 */
class HealthEngineService {
    calculateHealth(readings = {}, checklist = {}, customFields = []) {
        const issues = [];
        let status = 'Healthy';

        let fieldsList = [];
        if (Array.isArray(customFields)) {
            fieldsList = customFields;
        } else if (customFields && Array.isArray(customFields.customFields)) {
            fieldsList = customFields.customFields;
        }

        if (fieldsList.length === 0) {
            return {
                status: 'Healthy',
                healthScore: 100,
                issues: [],
                evaluatedAt: new Date().toISOString()
            };
        }

        const paramScores = [];

        fieldsList.forEach(f => {
            if (!f || !f.name) return;
            const name = String(f.name || '').trim();
            const unit = f.unit ? ` ${f.unit}` : '';
            const rawVal = f.value !== undefined && f.value !== null ? f.value : '';
            const strVal = String(rawVal).trim().toLowerCase();

            let paramScore = 100;

            // 1. Qualitative / Text matching
            if (strVal.includes('crit') || strVal.includes('fail') || strVal.includes('severe') || strVal.includes('bad') || strVal.includes('damage') || strVal.includes('leak')) {
                status = 'Critical';
                paramScore = 20;
                issues.push(`Critical condition detected in ${name}: "${rawVal}"`);
                paramScores.push(paramScore);
                return;
            } else if (strVal.includes('warn') || strVal.includes('poor') || strVal.includes('degraded') || strVal.includes('wear')) {
                if (status !== 'Critical') status = 'Warning';
                paramScore = 65;
                issues.push(`Warning condition detected in ${name}: "${rawVal}"`);
                paramScores.push(paramScore);
                return;
            }

            // 2. Numeric evaluation with Safe Operating Range (safeMin, safeMax)
            const num = parseFloat(rawVal);
            if (!isNaN(num)) {
                const hasMin = f.safeMin !== undefined && f.safeMin !== null && !isNaN(Number(f.safeMin));
                const hasMax = f.safeMax !== undefined && f.safeMax !== null && !isNaN(Number(f.safeMax));

                if (hasMin && hasMax) {
                    const safeMin = Number(f.safeMin);
                    const safeMax = Number(f.safeMax);
                    const rangeSpan = Math.max(1, safeMax - safeMin);

                    if (num < safeMin) {
                        const delta = safeMin - num;
                        const severity = delta / rangeSpan;
                        if (severity > 0.25 || num <= 0) {
                            status = 'Critical';
                            paramScore = Math.max(15, Math.round(50 - (severity * 20)));
                            issues.push(`🔴 CRITICAL LOW: ${name} is ${num}${unit} (Safe: ${safeMin} - ${safeMax}${unit})`);
                        } else {
                            if (status !== 'Critical') status = 'Warning';
                            paramScore = Math.max(60, Math.round(85 - (severity * 30)));
                            issues.push(`🟡 LOW READING: ${name} is ${num}${unit} (Safe: ${safeMin} - ${safeMax}${unit})`);
                        }
                    } else if (num > safeMax) {
                        const delta = num - safeMax;
                        const severity = delta / rangeSpan;
                        if (severity > 0.25) {
                            status = 'Critical';
                            paramScore = Math.max(15, Math.round(50 - (severity * 20)));
                            issues.push(`🔴 CRITICAL HIGH: ${name} is ${num}${unit} (Safe: ${safeMin} - ${safeMax}${unit})`);
                        } else {
                            if (status !== 'Critical') status = 'Warning';
                            paramScore = Math.max(60, Math.round(85 - (severity * 30)));
                            issues.push(`🟡 HIGH READING: ${name} is ${num}${unit} (Safe: ${safeMin} - ${safeMax}${unit})`);
                        }
                    } else {
                        paramScore = 100;
                    }
                } else {
                    paramScore = 100;
                }
            } else {
                paramScore = 100;
            }

            paramScores.push(paramScore);
        });

        const totalParamScore = paramScores.reduce((sum, s) => sum + s, 0);
        const avgScore = paramScores.length > 0 ? Math.round(totalParamScore / paramScores.length) : 100;
        const healthScore = Math.max(10, Math.min(100, avgScore));

        if (healthScore < 50 || status === 'Critical') status = 'Critical';
        else if (healthScore < 85 && status !== 'Critical') status = 'Warning';
        else if (healthScore >= 85 && issues.length === 0) status = 'Healthy';

        return {
            status,
            healthScore,
            issues,
            evaluatedAt: new Date().toISOString()
        };
    }
}

module.exports = new HealthEngineService();
