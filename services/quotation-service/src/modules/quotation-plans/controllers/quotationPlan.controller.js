const quotationPlanService = require('../services/quotationPlan.service');
const responseHandler = require('../../../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

class QuotationPlanController {
    getPublicPlans = async (req, res) => {
        try {
            const { search } = req.query || {};
            const plans = await quotationPlanService.getPublicPlans({ search });
            return responseHandler(res, HTTP_STATUS.OK, true, 'Active quotation plans fetched successfully', plans);
        } catch (error) {
            return responseHandler(res, error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
        }
    };

    getAllPlansForAdmin = async (req, res) => {
        try {
            const { search, isActive } = req.query || {};
            const plans = await quotationPlanService.getAllPlansForAdmin({ search, isActive });
            return responseHandler(res, HTTP_STATUS.OK, true, 'All quotation plans fetched successfully for Super Admin', plans);
        } catch (error) {
            return responseHandler(res, error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
        }
    };

    getPlanById = async (req, res) => {
        try {
            const { id } = req.params;
            const plan = await quotationPlanService.getPlanById(id);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Quotation plan details fetched successfully', plan);
        } catch (error) {
            return responseHandler(res, error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
        }
    };

    createPlan = async (req, res) => {
        try {
            const plan = await quotationPlanService.createPlan(req.body);
            return responseHandler(res, HTTP_STATUS.CREATED, true, 'Quotation pricing plan created successfully', plan);
        } catch (error) {
            return responseHandler(res, error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
        }
    };

    updatePlan = async (req, res) => {
        try {
            const { id } = req.params;
            const updated = await quotationPlanService.updatePlan(id, req.body);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Quotation pricing plan updated successfully', updated);
        } catch (error) {
            return responseHandler(res, error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
        }
    };

    togglePlanActive = async (req, res) => {
        try {
            const { id } = req.params;
            const updated = await quotationPlanService.togglePlanActive(id);
            return responseHandler(res, HTTP_STATUS.OK, true, `Plan status updated to ${updated.isActive ? 'Active' : 'Inactive'}`, updated);
        } catch (error) {
            return responseHandler(res, error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
        }
    };

    deletePlan = async (req, res) => {
        try {
            const { id } = req.params;
            await quotationPlanService.deletePlan(id);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Quotation plan deleted successfully');
        } catch (error) {
            return responseHandler(res, error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
        }
    };
}

module.exports = new QuotationPlanController();
