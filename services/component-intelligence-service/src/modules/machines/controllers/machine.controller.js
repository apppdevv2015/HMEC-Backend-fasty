const machineService = require('../services/machine.service');
const responseHandler = require('../../../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

class MachineController {
    addMachine = async (req, res) => {
        try {
            req.body.companyId = req.user.companyId;
            const machine = await machineService.addMachine(req.body);
            return responseHandler(res, HTTP_STATUS.CREATED, true, 'Machine registered successfully', machine);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    getMachines = async (req, res) => {
        try {
            const { companyId, page, limit, search } = req.query;
            const targetCompanyId = companyId || req.user?.companyId || null;
            if (page || limit || search) {
                const paginatedResult = await machineService.getPaginatedMachines({
                    companyId: targetCompanyId,
                    page: Number(page) || 1,
                    limit: Number(limit) || 10,
                    search: search || ''
                });
                return responseHandler(res, HTTP_STATUS.OK, true, 'Machines fetched successfully with pagination', paginatedResult);
            }
            const machines = await machineService.getMachines(targetCompanyId);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Machines fetched successfully', machines || []);
        } catch (error) {
            console.error('[GET MACHINES ERROR]:', error);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Machines fetched (fallback)', []);
        }
    };

    getMachineById = async (req, res) => {
        try {
            const machine = await machineService.getMachineById(req.params.id);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Machine details fetched successfully', machine);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    getMachineAssignment = async (req, res) => {
        try {
            const assignment = await machineService.getMachineAssignment(req.params.id);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Machine assignment details fetched successfully', assignment);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    getAllAssignedMachines = async (req, res) => {
        try {
            const companyId = req.query?.companyId || req.user?.companyId || null;
            const operatorId = req.query?.operatorId || null;
            const supervisorId = req.query?.supervisorId || null;
            const assignments = await machineService.getAllAssignedMachines(companyId, operatorId, supervisorId);
            return responseHandler(res, HTTP_STATUS.OK, true, 'All assigned machines fetched successfully', assignments || []);
        } catch (error) {
            console.error('[GET_ALL_ASSIGNED_MACHINES_ERR]:', error);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Assigned machines (empty fallback)', []);
        }
    };

    getUnassignedMachines = async (req, res) => {
        try {
            const companyId = req.query?.companyId || req.user?.companyId || null;
            const unassigned = await machineService.getUnassignedMachines(companyId);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Unassigned machines fetched successfully', unassigned || []);
        } catch (error) {
            console.error('[GET_UNASSIGNED_MACHINES_ERR]:', error);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Unassigned machines (empty fallback)', []);
        }
    };

    getOperatorAssignmentsHistory = async (req, res) => {
        try {
            const operatorId = req.params?.operatorId || req.query?.operatorId || req.user?.id || req.user?.userId || null;
            const companyId = req.query?.companyId || req.user?.companyId || null;
            const data = await machineService.getOperatorAssignmentsHistory(operatorId, companyId);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Operator machine assignments history fetched successfully', data);
        } catch (error) {
            console.error('[GET_OPERATOR_ASSIGNMENTS_ERR]:', error);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Operator assignments (empty fallback)', {
                operator: { operatorId: 'N/A', operatorName: 'Operator', companyId: null },
                summary: { totalAssignedCount: 0, activeCount: 0 },
                activeAssignedMachines: [],
                assignmentHistory: []
            });
        }
    };

    updateMachine = async (req, res) => {
        try {
            const machine = await machineService.updateMachine(req.params.id, req.body);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Machine updated successfully', machine);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    assignMachine = async (req, res) => {
        try {
            const machineId = req.params?.id || req.body?.machineId;
            if (!machineId) {
                return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, 'machineId is required for machine assignment');
            }
            const assignedMachine = await machineService.assignMachine(machineId, req.body, req.user);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Machine assigned successfully', assignedMachine);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    unassignMachine = async (req, res) => {
        try {
            const machineId = req.params?.id;
            if (!machineId) {
                return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, 'machineId is required');
            }
            const role = req.query?.role || req.body?.role || req.query?.targetRole || req.body?.targetRole;
            const result = await machineService.unassignMachine(machineId, req.user, { role });
            return responseHandler(res, HTTP_STATUS.OK, true, 'Machine unassigned successfully', result);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    deleteMachine = async (req, res) => {
        try {
            const machine = await machineService.deleteMachine(req.params.id);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Machine deleted successfully', machine);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    getCategories = async (req, res) => {
        try {
            const companyId = req.query.companyId || req.user?.companyId;
            const includeInactive = req.query.includeInactive === 'true';
            const categories = await machineService.getCategories(companyId, includeInactive);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Machine categories fetched successfully', categories);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    createCategory = async (req, res) => {
        try {
            const companyId = req.body.companyId || req.user?.companyId;
            const category = await machineService.createCategory({ ...req.body, companyId });
            return responseHandler(res, HTTP_STATUS.CREATED, true, 'Machine category created successfully', category);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    deleteCategory = async (req, res) => {
        try {
            const category = await machineService.deleteCategory(req.params.id);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Machine category deleted successfully', category);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    updateCategory = async (req, res) => {
        try {
            const category = await machineService.updateCategory(req.params.id, req.body);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Machine category updated successfully', category);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    getMachineComponents = async (req, res) => {
        try {
            const componentService = require('../../components/services/component.service');
            const equipmentSpecMasterService = require('../services/equipmentSpecMaster.service');
            const prisma = require('../../../database/prismaClient');
            const machineId = req.params.id || req.params.machineId;

            // 1. Try fetching from componentService
            let components = await componentService.getComponents({ machineId });

            // 2. Fetch machine record to get brand, model, equipmentType
            const machine = await prisma.machine.findFirst({
                where: {
                    OR: [
                        { id: machineId },
                        { name: { equals: machineId, mode: 'insensitive' } },
                        { serialNumber: { equals: machineId, mode: 'insensitive' } }
                    ]
                }
            });

            // 3. Fetch manual inspection data & component health for this machine
            let healthRecords = [];
            try {
                healthRecords = await prisma.componentHealth.findMany({
                    where: { machineId: machine ? machine.id : machineId }
                });
            } catch (e) {}

            const healthMap = {};
            healthRecords.forEach(h => {
                if (h.componentCategory) healthMap[h.componentCategory.toLowerCase().trim()] = h;
                if (h.componentName) healthMap[h.componentName.toLowerCase().trim()] = h;
            });

            // 4. If no registered components exist yet, generate from spec template
            if (!components || components.length === 0) {
                const spec = await equipmentSpecMasterService.getSpecTemplate(
                    machine?.equipmentType || machine?.model || '',
                    machine?.model || machine?.name || ''
                );

                if (spec && Array.isArray(spec.components) && spec.components.length > 0) {
                    components = spec.components.map((sp, idx) => {
                        const compName = sp.name || `Component ${idx + 1}`;
                        const compCat = sp.category || compName.split(' ')[0] || 'General';
                        const hRecord = healthMap[compName.toLowerCase().trim()] || healthMap[compCat.toLowerCase().trim()] || null;

                        const score = hRecord ? Number(hRecord.healthScore || hRecord.score || 100) : 100;
                        const status = hRecord ? (hRecord.status || (score < 50 ? 'Critical' : score < 85 ? 'Warning' : 'Healthy')) : 'Healthy';

                        return {
                            id: `spec-${machine?.id || machineId}-${idx}`,
                            machineId: machine?.id || machineId,
                            name: compName,
                            category: compCat,
                            description: sp.description || `${compName} with standard parameters`,
                            serialNumber: `SN-${machine?.serialNumber ? machine.serialNumber.replace('SN-', '') : 'AUTO'}-${compCat.substring(0, 3).toUpperCase()}`,
                            supplier: machine?.manufacturer || 'OEM Standard',
                            installHours: 0,
                            currentHours: Math.round((100 - score) * 150),
                            plannedLife: 15000,
                            replacementCost: 45000,
                            condition: score >= 90 ? 1 : score >= 75 ? 2 : score >= 50 ? 3 : score >= 30 ? 4 : 5,
                            healthScore: score,
                            status: status,
                            machine: machine || null,
                            intelligence: {
                                hoursRun: Math.round((100 - score) * 150),
                                lifeUsedPercent: 100 - score,
                                remainingHours: Math.max(0, 15000 - Math.round((100 - score) * 150)),
                                riskStatus: status,
                                riskColor: status === 'Critical' ? 'red' : status === 'Warning' ? 'amber' : 'emerald',
                                riskDriver: 'Diagnostic Parameters',
                                estimatedSavings: '$12,400'
                            }
                        };
                    });
                }
            }

            return responseHandler(res, HTTP_STATUS.OK, true, 'Machine components fetched successfully', components);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    getConditions = async (req, res) => {
        try {
            const conditions = await machineService.getConditions();
            return responseHandler(res, HTTP_STATUS.OK, true, 'Machine conditions fetched successfully', conditions);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };
}

module.exports = new MachineController();
