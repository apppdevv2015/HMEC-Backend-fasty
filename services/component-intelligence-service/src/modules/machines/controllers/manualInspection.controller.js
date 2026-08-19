const prisma = require('../../../database/prismaClient');
const healthEngineService = require('../services/healthEngine.service');
const responseHandler = require('../../../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

class ManualInspectionController {
    submitManualData = async (req, res) => {
        try {
            const machineId = req.params.id;
            const { readings = {}, checklist = {}, customFields = [], componentCategory = 'General' } = req.body;

            // 1. Calculate health status using Health Engine
            const healthResult = healthEngineService.calculateHealth(readings, checklist, customFields);

            // 2. Find target Component record by machineId and name
            const compName = String(componentCategory).trim();
            let targetComponent = await prisma.component.findFirst({
                where: {
                    machineId,
                    OR: [
                        { name: { equals: compName, mode: 'insensitive' } },
                        { description: { contains: compName, mode: 'insensitive' } },
                        { category: { contains: compName, mode: 'insensitive' } }
                    ]
                }
            });

            const safeParams = JSON.parse(JSON.stringify(
                customFields && customFields.length > 0 ? customFields : { readings, checklist, customFields }
            ));

            if (targetComponent) {
                await prisma.component.update({
                    where: { id: targetComponent.id },
                    data: {
                        healthScore: healthResult.healthScore,
                        inspectionParameters: safeParams,
                        lastInspectedAt: new Date()
                    }
                });
            }

            // 3. Insert record into ComponentHealth DB table!
            const componentHealthRecord = await prisma.componentHealth.create({
                data: {
                    machineId,
                    componentId: targetComponent?.id || null,
                    componentName: compName,
                    serialNumber: targetComponent?.serialNumber || 'SN-AUTO-001',
                    parameters: safeParams,
                    healthScore: healthResult.healthScore,
                    status: healthResult.status
                }
            });

            // 4. Aggregate machine overall health from all componentHealth records for this machine
            const inspectedComponents = await prisma.component.findMany({
                where: {
                    machineId,
                    healthScore: { not: null }
                }
            });

            let overallMachineHealth = healthResult.healthScore;
            let machineStatus = healthResult.status;

            if (inspectedComponents.length > 0) {
                const totalScore = inspectedComponents.reduce((sum, c) => sum + (c.healthScore || 0), 0);
                overallMachineHealth = Math.round(totalScore / inspectedComponents.length);

                const hasCritical = inspectedComponents.some(c => (c.healthScore || 0) < 50);
                const hasWarning = inspectedComponents.some(c => (c.healthScore || 0) >= 50 && (c.healthScore || 0) < 85);

                if (hasCritical) machineStatus = 'Critical';
                else if (hasWarning) machineStatus = 'Warning';
                else machineStatus = 'Healthy';
            }

            // 5. Save updated machine healthScore & status to Machine table in DB!
            const updatedMachine = await prisma.machine.update({
                where: { id: machineId },
                data: {
                    healthScore: overallMachineHealth,
                    status: machineStatus
                }
            });

            return responseHandler(res, HTTP_STATUS.OK, true, `Inspection saved for ${compName}. Health: ${healthResult.healthScore}%, Machine Status: ${machineStatus}`, {
                machine: updatedMachine,
                componentHealth: componentHealthRecord,
                component: {
                    id: targetComponent?.id || null,
                    name: compName,
                    healthScore: healthResult.healthScore,
                    status: healthResult.status
                },
                health: {
                    ...healthResult,
                    overallMachineHealth,
                    machineStatus
                }
            });
        } catch (error) {
            console.error('[MANUAL_INSPECTION_SUBMIT_ERROR]:', error);
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message || 'Inspection submit error');
        }
    };

    getManualData = async (req, res) => {
        try {
            const machineId = req.params.id;
            const machine = await prisma.machine.findUnique({ where: { id: machineId } });
            if (!machine) {
                return responseHandler(res, HTTP_STATUS.NOT_FOUND, false, 'Machine not found');
            }

            const records = await prisma.componentHealth.findMany({
                where: { machineId },
                orderBy: { createdAt: 'desc' }
            });

            return responseHandler(res, HTTP_STATUS.OK, true, 'Machine inspection & component health records fetched successfully', {
                machineId: machine.id,
                machineName: machine.name,
                status: machine.status || 'Healthy',
                healthScore: machine.healthScore || null,
                records
            });
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };
}

module.exports = new ManualInspectionController();
