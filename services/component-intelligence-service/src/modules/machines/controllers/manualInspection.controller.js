const machineRepository = require('../repositories/machine.repository');
const healthEngineService = require('../services/healthEngine.service');
const responseHandler = require('../../../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

class ManualInspectionController {
    submitManualData = async (req, res) => {
        try {
            const machineId = req.params.id;
            const { readings = {}, checklist = {}, componentCategory = 'General' } = req.body;

            // 1. Calculate health status using Health Engine
            const healthResult = healthEngineService.calculateHealth(readings, checklist);

            // 2. Update machine status in Database
            const updatedMachine = await machineRepository.update(machineId, {
                status: healthResult.status,
            });

            return responseHandler(res, HTTP_STATUS.OK, true, `Manual data & inspection saved. Calculated Status: ${healthResult.status}`, {
                machine: updatedMachine,
                health: healthResult,
                readings,
                checklist,
                componentCategory,
            });
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    getManualData = async (req, res) => {
        try {
            const machineId = req.params.id;
            const machine = await machineRepository.findById(machineId);
            if (!machine) {
                return responseHandler(res, HTTP_STATUS.NOT_FOUND, false, 'Machine not found');
            }
            return responseHandler(res, HTTP_STATUS.OK, true, 'Machine inspection data fetched successfully', {
                machineId: machine.id,
                machineName: machine.name,
                status: machine.status || 'Healthy',
            });
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };
}

module.exports = new ManualInspectionController();
