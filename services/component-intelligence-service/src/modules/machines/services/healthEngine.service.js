/**
 * Health Engine Calculator for Heavy Mining Equipment (HME)
 * Evaluates Operating Parameters & Inspection Checklists to compute Health Status (Healthy, Warning, Critical) and Health Score (0-100).
 */
class HealthEngineService {
    calculateHealth(readings = {}, checklist = {}, customFields = []) {
        let penalties = 0;
        const issues = [];
        let status = 'Healthy';

        const fieldsList = Array.isArray(customFields) ? customFields : [];

        fieldsList.forEach(f => {
            const name = String(f.name || '').toLowerCase();
            const val = String(f.value || '').toLowerCase();

            if (val.includes('crit') || val.includes('fail') || val.includes('severe')) {
                status = 'Critical';
                penalties += 35;
                issues.push(`Critical issue in ${f.name || 'Parameter'}: ${f.value}`);
            } else if (val.includes('warn') || val.includes('high') || val.includes('low') || val.includes('leak')) {
                if (status !== 'Critical') status = 'Warning';
                penalties += 20;
                issues.push(`Warning in ${f.name || 'Parameter'}: ${f.value}`);
            }

            const num = parseFloat(val);
            if (!isNaN(num)) {
                if (name.includes('temp') && num > 95) {
                    if (num > 105) status = 'Critical';
                    else if (status !== 'Critical') status = 'Warning';
                    penalties += 20;
                    issues.push(`Elevated ${f.name || 'Temperature'}: ${num}`);
                } else if (name.includes('press') && num < 2.0 && num > 0) {
                    if (status !== 'Critical') status = 'Warning';
                    penalties += 20;
                    issues.push(`Low ${f.name || 'Pressure'}: ${num}`);
                } else if ((name.includes('volt') || name.includes('v') || name.includes('battery')) && (num > 32 || num < 20)) {
                    if (num > 50 || num < 15) status = 'Critical';
                    else if (status !== 'Critical') status = 'Warning';
                    penalties += 30;
                    issues.push(`Abnormal ${f.name || 'Voltage'} Reading: ${num}`);
                }
            }
        });

        const healthScore = Math.max(10, 100 - penalties);
        if (healthScore < 50) status = 'Critical';
        else if (healthScore < 85 && status !== 'Critical') status = 'Warning';

        return {
            status,
            healthScore,
            issues,
            evaluatedAt: new Date().toISOString()
        };
    }
}

module.exports = new HealthEngineService();
