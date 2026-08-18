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
            if (page || limit || search) {
                const paginatedResult = await machineService.getPaginatedMachines({
                    companyId,
                    page: Number(page) || 1,
                    limit: Number(limit) || 10,
                    search: search || ''
                });
                return responseHandler(res, HTTP_STATUS.OK, true, 'Machines fetched successfully with pagination', paginatedResult);
            }
            const machines = await machineService.getMachines(companyId);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Machines fetched successfully', machines);
        } catch (error) {
            console.error('[GET MACHINES ERROR]:', error);
            return responseHandler(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message || 'Failed to fetch machines');
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
            const companyId = req.query.companyId || req.user?.companyId;
            const operatorId = req.query.operatorId || null;
            const assignments = await machineService.getAllAssignedMachines(companyId, operatorId);
            return responseHandler(res, HTTP_STATUS.OK, true, 'All assigned machines fetched successfully', assignments);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    getOperatorAssignmentsHistory = async (req, res) => {
        try {
            const operatorId = req.params?.operatorId || req.query?.operatorId || req.user?.id;
            const companyId = req.query?.companyId || req.user?.companyId;
            if (!operatorId) {
                return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, 'operatorId is required');
            }
            const data = await machineService.getOperatorAssignmentsHistory(operatorId, companyId);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Operator machine assignments history fetched successfully', data);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
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
}

module.exports = new MachineController();
