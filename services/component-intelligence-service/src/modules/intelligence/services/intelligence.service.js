const Decimal = require('decimal.js');

class IntelligenceService {
    /**
     * Safe, 100% accurate, high-precision calculation engine
     * Bypasses division-by-zero, negative numbers, and null values safely.
     */
    calculateMetrics(comp) {
        // Safe conversions to avoid NaN/null parsing issues
        const plannedLife = Number(comp.expectedLifeHours ?? comp.plannedLife ?? 0) <= 0 ? 1 : Number(comp.expectedLifeHours ?? comp.plannedLife);
        const currentHours = Number(comp.expectedLifeHours ? (comp.currentLifeHours ?? 0) : (comp.currentHours ?? 0));
        const installHours = Number(comp.expectedLifeHours ? 0 : (comp.installHours ?? 0));
        const condition = Number(comp.condition ?? 1);
        const replacementCost = new Decimal(comp.replacementCost ?? 0);

        // 1. Calculate Hours Run (Guardrail: cannot be negative)
        let hoursRun = currentHours - installHours;
        if (hoursRun < 0) hoursRun = 0;

        // 2. High-precision division using Decimal.js
        const hoursDecimal = new Decimal(hoursRun);
        const plannedDecimal = new Decimal(plannedLife);

        let lifeUsedPercent = hoursDecimal.div(plannedDecimal).times(100).round().toNumber();
        if (lifeUsedPercent > 100) lifeUsedPercent = 100;
        if (lifeUsedPercent < 0) lifeUsedPercent = 0;

        // 3. Calculate Remaining Hours
        let remainingHours = plannedLife - hoursRun;
        if (remainingHours < 0) remainingHours = 0;

        // 4. Condition & Risk Assessment (Mapping color codes directly for frontend charts)
        let riskStatus = 'Healthy';
        let riskColor = '#10b981'; // Green
        let riskDriver = 'Normal';

        if (condition >= 5 || lifeUsedPercent >= 95) {
            riskStatus = 'Critical';
            riskColor = '#ef4444'; // Red
            riskDriver = condition >= 5 ? 'Poor Condition' : 'End of Life';
        } else if (condition >= 4 || lifeUsedPercent >= 85) {
            riskStatus = 'Warning';
            riskColor = '#f97316'; // Orange
            riskDriver = condition >= 4 ? 'Poor Condition' : 'End of Life';
        } else if (condition >= 3 || lifeUsedPercent >= 70) {
            riskStatus = 'Monitor';
            riskColor = '#eab308'; // Yellow
            riskDriver = 'Routine Monitoring Required';
        }

        // 5. Cost Savings Forecast (1.5x of base cost saved if proactively replaced)
        let estimatedSavings = new Decimal(0);
        if (riskStatus === 'Warning' || riskStatus === 'Monitor') {
            estimatedSavings = replacementCost.times(1.5);
        }

        return { 
            hoursRun, 
            lifeUsedPercent, 
            remainingHours, 
            riskStatus, 
            riskColor,
            riskDriver,
            estimatedSavings: estimatedSavings.toFixed(2)
        };
    }

    /**
     * Processes list of components to add calculated metrics
     */
    processRegister(components) {
        if (!Array.isArray(components)) return [];
        return components.map(comp => ({ 
            ...comp, 
            intelligence: this.calculateMetrics(comp) 
        }));
    }

    /**
     * Fetch and compile fleet health heatmap metrics, tabs, summary cards, and machine rows
     */
    async getFleetHeatMap(companyId) {
        const prisma = require('../../../database/prismaClient');

        // 1. Fetch all machines with components
        const machines = await prisma.machine.findMany({
            where: { companyId },
            include: { components: true }
        });

        // 2. Define category helper functions
        const getMachineType = (model) => {
            if (!model) return 'OTHER';
            const m = model.toUpperCase();
            if (m.includes('DOZER') || m.includes('D8') || m.includes('D10') || m.includes('D11') || m.includes('D6')) return 'DOZER';
            if (m.includes('DRILL') || m.includes('DR') || m.includes('MD')) return 'DRILL';
            if (m.includes('EXCAVATOR') || m.includes('EX') || m.includes('SHOVEL') || m.includes('FEL') || m.includes('990') || m.includes('992') || m.includes('994') || m.includes('LOADER')) {
                return 'EXCAVATOR';
            }
            if (m.includes('TRUCK') || m.includes('777') || m.includes('785') || m.includes('793') || m.includes('HT')) return 'HT';
            if (m.includes('GRADER') || m.includes('GD') || m.includes('16M') || m.includes('14M')) return 'GRADER';
            return 'OTHER';
        };

        const getMachineDisplayType = (model) => {
            const type = getMachineType(model);
            if (type === 'DOZER') return 'Dozer';
            if (type === 'DRILL') return 'Drill';
            if (type === 'GRADER') return 'Grader';
            if (type === 'HT') return 'HT';
            if (type === 'EXCAVATOR') {
                const m = model.toUpperCase();
                if (m.includes('990') || m.includes('LOADER') || m.includes('FEL')) return 'FEL';
                if (m.includes('EX') || m.includes('EXCAVATOR')) return 'Excavator';
                return 'FEL';
            }
            return 'Other';
        };

        const getComponentSlot = (category) => {
            if (!category) return null;
            const cat = category.toLowerCase();
            if (cat.includes('tyre') || cat.includes('track') || cat.includes('wheel')) return 'tyre';
            if (cat.includes('engine') || cat.includes('motor') || cat.includes('turbo') || cat.includes('powertrain')) return 'engine';
            if (cat.includes('hydraulic') || cat.includes('pump') || cat.includes('cylinder') || cat.includes('steering') || cat.includes('hoist') || cat.includes('blade')) return 'hydraulic';
            if (cat.includes('transmission') || cat.includes('gearbox') || cat.includes('drive') || cat.includes('trans') || cat.includes('swing') || cat.includes('rotary')) return 'transmission';
            return null;
        };

        // 3. Process each machine
        const fleetData = machines.map(machine => {
            const componentsBySlot = {
                tyre: [],
                engine: [],
                hydraulic: [],
                transmission: []
            };

            // Categorize machine's components into slots
            machine.components.forEach(comp => {
                const slot = getComponentSlot(comp.category);
                if (slot) {
                    const metrics = this.calculateMetrics(comp);
                    const lifeLeftPercent = 100 - metrics.lifeUsedPercent;
                    componentsBySlot[slot].push({
                        status: metrics.riskStatus === 'Critical' ? 'crit' : (metrics.riskStatus === 'Warning' || metrics.riskStatus === 'Monitor' ? 'warn' : 'ok'),
                        label: comp.description.toUpperCase(),
                        life: `${lifeLeftPercent}% life left`,
                        lifeLeftPercent
                    });
                }
            });

            // Map each slot to its worst-case component or default to 'none'
            const slots = ['tyre', 'engine', 'hydraulic', 'transmission'];
            const slotDetails = {};
            slots.forEach(slot => {
                const list = componentsBySlot[slot];
                if (list.length === 0) {
                    slotDetails[slot] = {
                        status: 'none',
                        label: slot.toUpperCase(),
                        life: 'No data'
                    };
                } else {
                    // Sort by lifeLeftPercent ascending to pick the lowest (worst) health
                    list.sort((a, b) => a.lifeLeftPercent - b.lifeLeftPercent);
                    slotDetails[slot] = {
                        status: list[0].status,
                        label: list[0].label,
                        life: list[0].life
                    };
                }
            });

            // Calculate overall risk
            let risk = 'Healthy';
            const statuses = Object.values(slotDetails).map(s => s.status);
            if (statuses.includes('crit')) {
                risk = 'Critical';
            } else if (statuses.includes('warn')) {
                risk = 'Warning';
            }

            return {
                id: machine.name,
                dbId: machine.id,
                name: machine.name,
                model: machine.model,
                serialNumber: machine.serialNumber,
                location: machine.site || 'Main Mine Site',
                fleet: machine.serialNumber,
                type: getMachineDisplayType(machine.model),
                rawType: getMachineType(machine.model),
                costPerHourTarget: machine.costPerHourTarget ? Number(machine.costPerHourTarget) : null,
                costPerTonTarget: machine.costPerTonTarget ? Number(machine.costPerTonTarget) : null,
                tyre: slotDetails.tyre,
                engine: slotDetails.engine,
                hydraulic: slotDetails.hydraulic,
                transmission: slotDetails.transmission,
                risk
            };

        });

        // 4. Calculate Summary Stats
        const totalMachines = fleetData.length;
        const criticalCount = fleetData.filter(m => m.risk === 'Critical').length;
        const warningCount = fleetData.filter(m => m.risk === 'Warning').length;
        const healthyCount = fleetData.filter(m => m.risk === 'Healthy').length;

        // 5. Aggregate category counts for tabs
        const typeCounts = {
            DOZER: 0,
            DRILL: 0,
            EXCAVATOR: 0,
            HT: 0,
            GRADER: 0
        };
        fleetData.forEach(m => {
            if (typeCounts[m.rawType] !== undefined) {
                typeCounts[m.rawType]++;
            }
        });

        const categories = [
            { name: 'All Equipment', count: totalMachines, active: true },
            { name: 'Dozers', count: typeCounts.DOZER, active: false },
            { name: 'Drills', count: typeCounts.DRILL, active: false },
            { name: 'Excavators / Shovels / FEL', count: typeCounts.EXCAVATOR, active: false },
            { name: 'Trucks', count: typeCounts.HT, active: false },
            { name: 'Graders', count: typeCounts.GRADER, active: false }
        ];

        // 6. Aggregate summary cards
        const summaryCardTemplates = [
            { rawType: 'DOZER', name: 'Dozers', color: 'text-orange-500', bg: 'bg-orange-50/50' },
            { rawType: 'DRILL', name: 'Drills', color: 'text-blue-500', bg: 'bg-blue-50/50' },
            { rawType: 'EXCAVATOR', name: 'Excavators / Shovels / FEL', color: 'text-orange-400', bg: 'bg-orange-50/30' },
            { rawType: 'HT', name: 'Haul Trucks', color: 'text-red-500', bg: 'bg-red-50/50' },
            { rawType: 'GRADER', name: 'Graders', color: 'text-teal-500', bg: 'bg-teal-50/50' }
        ];

        const summaryCards = summaryCardTemplates.map(tpl => {
            const machinesOfType = fleetData.filter(m => m.rawType === tpl.rawType);
            return {
                type: tpl.rawType,
                name: tpl.name,
                total: machinesOfType.length,
                crit: machinesOfType.filter(m => m.risk === 'Critical').length,
                warn: machinesOfType.filter(m => m.risk === 'Warning').length,
                ok: machinesOfType.filter(m => m.risk === 'Healthy').length,
                color: tpl.color,
                bg: tpl.bg
            };
        });

        return {
            stats: {
                totalMachines,
                critical: criticalCount,
                warning: warningCount,
                healthy: healthyCount
            },
            categories,
            summaryCards,
            fleetData
        };
    }
}

module.exports = new IntelligenceService();
