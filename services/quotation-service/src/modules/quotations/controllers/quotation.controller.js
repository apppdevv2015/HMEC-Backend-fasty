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

    // Quotation Requests CRUD (Client Inquiry)
    async createQuotationRequest(req, res) {
        try {
            const quotationRequest = await quotationService.createQuotationRequest(req.body, req.user);
            return responseHandler(res, HTTP_STATUS.CREATED, true, 'Quotation request submitted successfully', quotationRequest);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async getQuotationRequests(req, res) {
        try {
            const quotationRequests = await quotationService.getQuotationRequests(req.user, req.query);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Quotation requests retrieved successfully', quotationRequests);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async getQuotationRequestById(req, res) {
        try {
            const quotationRequest = await quotationService.getQuotationRequestById(req.params.id, req.user);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Quotation request retrieved successfully', quotationRequest);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.NOT_FOUND, false, error.message);
        }
    }

    async updateQuotationRequest(req, res) {
        try {
            const quotationRequest = await quotationService.updateQuotationRequest(req.params.id, req.body, req.user);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Quotation request updated successfully', quotationRequest);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async deleteQuotationRequest(req, res) {
        try {
            await quotationService.deleteQuotationRequest(req.params.id, req.user);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Quotation request deleted successfully');
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async createAddonQuotation(req, res) {
        try {
            const quotation = await quotationService.createAddonQuotation(req.body, req.user);
            return responseHandler(res, HTTP_STATUS.CREATED, true, 'Add-on quotation created successfully', quotation);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async submitEftPayment(req, res) {
        try {
            const quotation = await quotationService.submitEftPayment(req.params.id, req.body, req.user);
            return responseHandler(res, HTTP_STATUS.OK, true, 'EFT payment submitted successfully', quotation);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }

    async verifyEftPayment(req, res) {
        try {
            const quotation = await quotationService.verifyEftPayment(req.params.id, req.body, req.user);
            return responseHandler(res, HTTP_STATUS.OK, true, 'EFT payment verified and processed successfully', quotation);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    }
}

module.exports = new QuotationController();
