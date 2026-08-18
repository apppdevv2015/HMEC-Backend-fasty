/**
 * Health Engine Calculator for Heavy Mining Equipment (HME)
 * Evaluates Operating Parameters & Inspection Checklists to compute Health Status (Healthy, Warning, Critical) and Health Score (0-100).
 */
class HealthEngineService {
    calculateHealth(readings = {}, checklist = {}) {
        let penalties = 0;
        const issues = [];
        let status = 'Healthy';

        // 1. Temperature Checks (°C)
        const coolantTemp = Number(readings.coolantTemp || 0);
        const engineOilTemp = Number(readings.engineOilTemp || 0);
        const hydraulicTemp = Number(readings.hydraulicOilTemp || 0);
        const transTemp = Number(readings.transmissionOilTemp || 0);

        if (coolantTemp > 105 || engineOilTemp > 115 || hydraulicTemp > 95 || transTemp > 100) {
            status = 'Critical';
            penalties += 40;
            issues.push('Critical Overheating Detected');
        } else if (coolantTemp > 95 || engineOilTemp > 105 || hydraulicTemp > 85 || transTemp > 90) {
            if (status !== 'Critical') status = 'Warning';
            penalties += 20;
            issues.push('Elevated Temperature Warning');
        }

        // 2. Oil & Hydraulic Pressure Checks (bar)
        const engineOilPressure = Number(readings.engineOilPressure || 0);

        if (engineOilPressure > 0 && engineOilPressure < 1.8) {
            status = 'Critical';
            penalties += 40;
            issues.push('Dangerously Low Engine Oil Pressure');
        } else if (engineOilPressure > 0 && engineOilPressure < 2.5) {
            if (status !== 'Critical') status = 'Warning';
            penalties += 15;
            issues.push('Low Engine Oil Pressure Warning');
        }

        // 3. Fluid Leaks Check
        const fuelLeak = checklist.fuelLeak || readings.fuelLeak;
        const oilLeak = checklist.engineOilLeak || readings.oilLeak;
        const hydLeak = checklist.hydraulicLeak || readings.hydraulicLeak;
        const coolantLeak = checklist.coolantLeak || readings.coolantLeak;

        if (fuelLeak === 'Severe' || hydLeak === 'Severe' || oilLeak === 'Severe') {
            status = 'Critical';
            penalties += 35;
            issues.push('Severe Fluid Leakage Reported');
        } else if (fuelLeak === 'Minor' || hydLeak === 'Minor' || oilLeak === 'Minor' || coolantLeak === 'Minor') {
            if (status !== 'Critical') status = 'Warning';
            penalties += 15;
            issues.push('Minor Fluid Leak Detected');
        }

        // 4. Fluid Levels Check
        const oilLevel = checklist.engineOilLevel;
        const coolantLevel = checklist.coolantLevel;
        const hydLevel = checklist.hydraulicOilLevel;

        if (oilLevel === 'Critical Low' || coolantLevel === 'Critical Low' || hydLevel === 'Critical Low') {
            status = 'Critical';
            penalties += 30;
            issues.push('Critical Low Fluid Levels');
        } else if (oilLevel === 'Low' || coolantLevel === 'Low' || hydLevel === 'Low') {
            if (status !== 'Critical') status = 'Warning';
            penalties += 15;
            issues.push('Low Fluid Level Warning');
        }

        // 5. Brakes & Steering Check
        if (checklist.brakeCondition === 'Failed' || checklist.steeringCondition === 'Failed') {
            status = 'Critical';
            penalties += 45;
            issues.push('Critical Brake / Steering Failure');
        }

        // 6. Tyre Tread Depth Check (mm)
        const treadDepth = Number(readings.tyreTreadDepth || checklist.tyreTreadDepth || 10);
        if (treadDepth > 0 && treadDepth < 3) {
            if (status !== 'Critical') status = 'Warning';
            penalties += 20;
            issues.push('Worn Tyre Tread Depth (<3mm)');
        }

        // 7. Active Fault Codes (DTCs)
        if (readings.faultCodes && readings.faultCodes.trim()) {
            if (status !== 'Critical') status = 'Warning';
            penalties += 15;
            issues.push(`Active Fault Code: ${readings.faultCodes}`);
        }

        const healthScore = Math.max(0, 100 - penalties);

        return {
            status,
            healthScore,
            issues,
            evaluatedAt: new Date().toISOString()
        };
    }
}

module.exports = new HealthEngineService();
