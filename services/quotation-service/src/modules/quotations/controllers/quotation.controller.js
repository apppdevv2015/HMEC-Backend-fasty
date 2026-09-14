const quotationService = require("../services/quotation.service");
const responseHandler = require("../../../utils/responseHandler");
const { saveSignatureFile } = require("../../../utils/signatureStorage");
const invoicePdfService = require("../services/invoicePdf.service");
const contractPdfService = require("../services/contractPdf.service");
const { HTTP_STATUS } = responseHandler;

class QuotationController {
  async getQuotations(req, res) {
    try {
      const quotations = await quotationService.getQuotations(
        req.user,
        req.query,
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Quotations retrieved successfully",
        quotations,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async getQuotationById(req, res) {
    try {
      const quotation = await quotationService.getQuotationById(
        req.params.id,
        req.user,
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Quotation details retrieved successfully",
        quotation,
      );
    } catch (error) {
      return responseHandler(res, HTTP_STATUS.NOT_FOUND, false, error.message);
    }
  }

  async requestQuotation(req, res) {
    try {
      const quotation = await quotationService.requestQuotation(
        req.body,
        req.user,
      );
      return responseHandler(
        res,
        HTTP_STATUS.CREATED,
        true,
        "Quotation request submitted successfully",
        quotation,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async sendQuotation(req, res) {
    try {
      const quotation = await quotationService.sendQuotation(
        req.body,
        req.user,
      );
      return responseHandler(
        res,
        HTTP_STATUS.CREATED,
        true,
        "Official quotation generated and sent successfully",
        quotation,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async acceptQuotation(req, res) {
    try {
      const quotation = await quotationService.acceptQuotation(
        req.params.id,
        req.body,
        req.user,
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Quotation accepted and signed successfully",
        quotation,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async rejectQuotation(req, res) {
    try {
      const quotation = await quotationService.rejectQuotation(
        req.params.id,
        req.body,
        req.user,
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Quotation rejected successfully",
        quotation,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  // Quotation Requests CRUD (Client Inquiry)
  async createQuotationRequest(req, res) {
    try {
      const quotationRequest = await quotationService.createQuotationRequest(
        req.body,
        req.user,
      );
      return responseHandler(
        res,
        HTTP_STATUS.CREATED,
        true,
        "Quotation request submitted successfully",
        quotationRequest,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async getQuotationRequests(req, res) {
    try {
      const quotationRequests = await quotationService.getQuotationRequests(
        req.user,
        req.query,
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Quotation requests retrieved successfully",
        quotationRequests,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async getQuotationRequestById(req, res) {
    try {
      const quotationRequest = await quotationService.getQuotationRequestById(
        req.params.id,
        req.user,
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Quotation request retrieved successfully",
        quotationRequest,
      );
    } catch (error) {
      return responseHandler(res, HTTP_STATUS.NOT_FOUND, false, error.message);
    }
  }

  async updateQuotationRequest(req, res) {
    try {
      const quotationRequest = await quotationService.updateQuotationRequest(
        req.params.id,
        req.body,
        req.user,
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Quotation request updated successfully",
        quotationRequest,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async deleteQuotationRequest(req, res) {
    try {
      await quotationService.deleteQuotationRequest(req.params.id, req.user);
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Quotation request deleted successfully",
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async createAddonQuotation(req, res) {
    try {
      const quotation = await quotationService.createAddonQuotation(
        req.body,
        req.user,
      );
      return responseHandler(
        res,
        HTTP_STATUS.CREATED,
        true,
        "Add-on quotation created successfully",
        quotation,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async submitEftPayment(req, res) {
    try {
      const quotation = await quotationService.submitEftPayment(
        req.params.id,
        req.body,
        req.user,
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "EFT payment submitted successfully",
        quotation,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async verifyEftPayment(req, res) {
    try {
      const quotation = await quotationService.verifyEftPayment(
        req.params.id,
        req.body,
        req.user,
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "EFT payment verified and processed successfully",
        quotation,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  // ===== CONTRACT CONTROLLERS =====

  async getContracts(req, res) {
    try {
      const contracts = await quotationService.getContracts(
        req.user,
        req.query,
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Contracts retrieved successfully",
        contracts,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async getContractById(req, res) {
    try {
      const contract = await quotationService.getContractById(
        req.params.id,
        req.user,
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Contract details retrieved successfully",
        contract,
      );
    } catch (error) {
      return responseHandler(res, HTTP_STATUS.NOT_FOUND, false, error.message);
    }
  }

  async createContract(req, res) {
    try {
      const filePart = await req.file();

      if (!filePart) {
        return responseHandler(
          res,
          HTTP_STATUS.BAD_REQUEST,
          false,
          "Super Admin signature file (signatureFile) is required",
        );
      }

      const fields = filePart.fields || {};
      const getField = (key) => fields[key]?.value;

      const buffer = await filePart.toBuffer();
      const superAdminSignatureUrl = saveSignatureFile(
        buffer,
        filePart.filename,
        filePart.mimetype,
      );

      const contractData = {
        quotationId: getField("quotationId"),
        startDate: getField("startDate"),
        endDate: getField("endDate"),
        poNumber: getField("poNumber"),
        description: getField("description"),
        superAdminSignedBy: getField("superAdminSignedBy"),
        superAdminSignatureUrl,
      };

      const contract = await quotationService.createContract(
        contractData,
        req.user,
      );

      return responseHandler(
        res,
        HTTP_STATUS.CREATED,
        true,
        "Contract created and sent successfully",
        contract,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async updateContract(req, res) {
    try {
      const contract = await quotationService.updateContract(
        req.params.id,
        req.body,
        req.user,
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Contract updated successfully",
        contract,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async deleteContract(req, res) {
    try {
      await quotationService.deleteContract(req.params.id, req.user);
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Contract deleted successfully",
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async acceptContract(req, res) {
    try {
      const filePart = await req.file();

      if (!filePart) {
        return responseHandler(
          res,
          HTTP_STATUS.BAD_REQUEST,
          false,
          "Signature file (signatureFile) is required",
        );
      }

      const fields = filePart.fields || {};
      const signedBy = fields.signedBy?.value;
      const acceptanceDescription = fields.acceptanceDescription?.value;

      const buffer = await filePart.toBuffer();
      const signatureUrl = saveSignatureFile(
        buffer,
        filePart.filename,
        filePart.mimetype,
      );

      const contract = await quotationService.acceptContract(
        req.params.id,
        { signedBy, acceptanceDescription, signatureUrl },
        req.user,
      );

      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Contract accepted and signed successfully",
        contract,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async rejectContract(req, res) {
    try {
      const contract = await quotationService.rejectContract(
        req.params.id,
        req.body,
        req.user,
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Contract rejected successfully",
        contract,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async getContractPdf(req, res) {
    try {
      const contract = await quotationService.getContractById(
        req.params.id,
        req.user,
      );

      const pdfBuffer = await contractPdfService.generatePdfBuffer(contract);

      const disposition =
        req.query.download === "true" ? "attachment" : "inline";

      res.header("Content-Type", "application/pdf");

      res.header(
        "Content-Disposition",
        `${disposition}; filename="${contract.contractNumber}.pdf"`,
      );

      res.header("Content-Length", String(pdfBuffer.length));

      return res.send(pdfBuffer);
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  // ===== INVOICE CONTROLLERS =====

  async createInvoice(req, res) {
    try {
      const invoice = await quotationService.createInvoice(req.body, req.user);
      return responseHandler(
        res,
        HTTP_STATUS.CREATED,
        true,
        "Invoice generated successfully",
        invoice,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async getInvoices(req, res) {
    try {
      const invoices = await quotationService.getInvoices(req.user, req.query);
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Invoices retrieved successfully",
        invoices,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async getInvoiceById(req, res) {
    try {
      const invoice = await quotationService.getInvoiceById(
        req.params.id,
        req.user,
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Invoice details retrieved successfully",
        invoice,
      );
    } catch (error) {
      return responseHandler(res, HTTP_STATUS.NOT_FOUND, false, error.message);
    }
  }

  async getInvoicePdf(req, res) {
    try {
      const invoice = await quotationService.getInvoiceById(
        req.params.id,
        req.user,
      );
      const pdfBuffer = await invoicePdfService.generatePdfBuffer(invoice);

      const disposition =
        req.query.download === "true" ? "attachment" : "inline";

      res.header("Content-Type", "application/pdf");
      res.header(
        "Content-Disposition",
        `${disposition}; filename="${invoice.invoiceNumber}.pdf"`,
      );
      return res.send(pdfBuffer);
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

    async submitInvoicePaymentProof(req, res) {
    try {
      const filePart = await req.file();

      if (!filePart) {
        return responseHandler(
          res,
          HTTP_STATUS.BAD_REQUEST,
          false,
          "Payment proof file (proofFile) is required",
        );
      }

      const fields = filePart.fields || {};
      const getField = (key) => fields[key]?.value;

      const buffer = await filePart.toBuffer();

      const ALLOWED_PROOF_MIME_TYPES = [
        "image/jpeg",
        "image/png",
        "application/pdf",
      ];
      const MAX_PROOF_FILE_SIZE = 5 * 1024 * 1024;

      if (!ALLOWED_PROOF_MIME_TYPES.includes(filePart.mimetype)) {
        return responseHandler(
          res,
          HTTP_STATUS.BAD_REQUEST,
          false,
          "Only JPG, PNG, or PDF files are allowed",
        );
      }
      if (buffer.length > MAX_PROOF_FILE_SIZE) {
        return responseHandler(
          res,
          HTTP_STATUS.BAD_REQUEST,
          false,
          "File size must not exceed 5 MB",
        );
      }

      const proofFileUrl = saveSignatureFile(
        buffer,
        filePart.filename,
        filePart.mimetype,
      );

      const paymentData = {
        paymentMethod: getField("paymentMethod"),
        paymentDate: getField("paymentDate"),
        amountPaid: getField("amountPaid"),
        transactionReference: getField("transactionReference"),
        proofFileUrl,
      };

      const proof = await quotationService.submitInvoicePaymentProof(
        req.params.id,
        paymentData,
        req.user,
      );

      return responseHandler(
        res,
        HTTP_STATUS.CREATED,
        true,
        "Payment proof submitted successfully",
        proof,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async getPaymentProofs(req, res) {
    try {
      const proofs = await quotationService.getPaymentProofs(
        req.user,
        req.query,
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Payment proofs retrieved successfully",
        proofs,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

    async verifyPaymentProof(req, res) {
    try {
      const proof = await quotationService.verifyPaymentProof(
        req.params.id,
        req.body,
        req.user,
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Payment proof verified and invoice marked as paid",
        proof,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async getBillingProfile(req, res) {
    try {
      const profile = await quotationService.getBillingProfile(req.user);
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Billing profile retrieved successfully",
        profile,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }

  async upsertBillingProfile(req, res) {
    try {
      const profile = await quotationService.upsertBillingProfile(
        req.body,
        req.user,
      );
      return responseHandler(
        res,
        HTTP_STATUS.OK,
        true,
        "Billing profile saved successfully",
        profile,
      );
    } catch (error) {
      return responseHandler(
        res,
        HTTP_STATUS.BAD_REQUEST,
        false,
        error.message,
      );
    }
  }
}

module.exports = new QuotationController();
