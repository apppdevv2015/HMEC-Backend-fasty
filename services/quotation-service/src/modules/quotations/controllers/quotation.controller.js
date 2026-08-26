const quotationService = require('../services/quotation.service');
const responseHandler = require('../../../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

class QuotationController {
    async getQuotations(req, res) {
        try {
            const quotations = await quotationService.getQuotations(req.user, req.query);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Quotations retrieved successfully', quotations);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async getQuotationById(req, res) {
        try {
            const quotation = await quotationService.getQuotationById(req.params.id, req.user);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Quotation details retrieved successfully', quotation);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.NOT_FOUND, false, error.message);
        }
    }

    async requestQuotation(req, res) {
        try {
            const quotation = await quotationService.requestQuotation(req.body, req.user);
            return responseHandler(res, HTTP_STATUS.CREATED, true, 'Quotation request submitted successfully', quotation);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async sendQuotation(req, res) {
        try {
            const quotation = await quotationService.sendQuotation(req.body, req.user);
            return responseHandler(res, HTTP_STATUS.CREATED, true, 'Official quotation generated and sent successfully', quotation);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async acceptQuotation(req, res) {
        try {
            const quotation = await quotationService.acceptQuotation(req.params.id, req.body, req.user);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Quotation accepted and signed successfully', quotation);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async rejectQuotation(req, res) {
        try {
            const quotation = await quotationService.rejectQuotation(req.params.id, req.body, req.user);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Quotation rejected successfully', quotation);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }
}

module.exports = new QuotationController();
