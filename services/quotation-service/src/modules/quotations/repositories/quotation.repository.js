const prisma = require("../../../config/database");

const CONTRACT_QUOTATION_SELECT = Object.freeze({
  quotationNumber: true,
  companyName: true,
  contactPerson: true,
  contactEmail: true,
  contactPhone: true,
  machineCount: true,
  licensedMachineAllowance: true,
  implementationFee: true,
  monthlySiteLicence: true,
  additionalMachineCharge: true,
  optionalServices: true,
  paymentTerms: true,
});

const QUOTATION_UPDATABLE_FIELDS = Object.freeze([
  "status",
  "tier",
  "machineCount",
  "contractDuration",
  "billingFrequency",
  "licensedMachineAllowance",
  "implementationFee",
  "monthlySiteLicence",
  "additionalMachineCharge",
  "trialRequested",
  "trialDuration",
  "trialMachines",
  "trialDescription",
  "baseAmount",
  "optionalServicesAmount",
  "discountAmount",
  "taxAmount",
  "totalAmount",
  "optionalServices",
  "scopeOfWork",
  "paymentTerms",
  "notes",
  "validUntil",
  "sentAt",
  "acceptedAt",
  "rejectedAt",
  "signedBy",
  "signatureUrl",
]);

/** Fields accepted on `Contract.update`, applied allow-list style. */
const CONTRACT_UPDATABLE_FIELDS = Object.freeze([
  "startDate",
  "endDate",
  "poNumber",
  "description",
  "status",
  "sentAt",
  "superAdminSignatureUrl",
  "superAdminSignedBy",
  "superAdminSignedByUserId",
  "superAdminSignedAt",
  "companySignatureUrl",
  "companySignedBy",
  "companySignedByUserId",
  "companySignedAt",
  "acceptanceDescription",
  "rejectedBy",
  "rejectedByUserId",
  "rejectedAt",
  "rejectionReason",
]);

/** Fields accepted on `Invoice.update`, applied allow-list style. */
const INVOICE_UPDATABLE_FIELDS = Object.freeze([
  "status",
  "lineItems",
  "subtotal",
  "totalAmount",
  "paymentTerms",
  "notes",
  "dueDate",
  "pdfUrl",
]);

const PAYMENT_PROOF_UPDATABLE_FIELDS = Object.freeze([
  "status",
  "verifiedAt",
  "verifiedBy",
  "verifiedByUserId",
]);

/** Nested select used when pulling a Contract for invoice generation. */
const INVOICE_CONTRACT_SELECT = Object.freeze({
  id: true,
  contractNumber: true,
  startDate: true,
  endDate: true,
  poNumber: true,
  status: true,
  companyId: true,
  quotationId: true,
  company: {
    select: {
      id: true,
      name: true,
      companyCode: true,
    },
  },
  quotation: { select: CONTRACT_QUOTATION_SELECT },
});

/**
 * Builds a Prisma `data`/`update` object by copying only the keys in
 * `allowedFields` that are present (`!== undefined`) on `source`.
 *
 * @param {Record<string, any>} source
 * @param {readonly string[]} allowedFields
 * @returns {Record<string, any>}
 */
function pickAllowed(source, allowedFields) {
  const result = {};
  for (const key of allowedFields) {
    if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

class QuotationRepository {
  // ===== QUOTATION FUNCTIONS =====

  /**
   * @param {Record<string, any>} [where]
   * @returns {Promise<number>}
   */
  async count(where = {}) {
    return prisma.quotation.count({ where });
  }

  /**
   * @param {{ companyId?: string, status?: string, quotationRequestId?: string, search?: string }} [filter]
   * @returns {Promise<object[]>}
   */
  async findAll(filter = {}) {
    const where = {};

    if (filter.companyId) {
      where.companyId = filter.companyId;
    }
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.quotationRequestId) {
      where.quotationRequestId = filter.quotationRequestId;
    }
    if (filter.search) {
      where.OR = [
        { quotationNumber: { contains: filter.search, mode: "insensitive" } },
        { companyName: { contains: filter.search, mode: "insensitive" } },
        { contactPerson: { contains: filter.search, mode: "insensitive" } },
        { contactEmail: { contains: filter.search, mode: "insensitive" } },
      ];
    }

    return prisma.quotation.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Looks up a quotation by primary key or by its human-readable
   * quotation number.
   *
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    return prisma.quotation.findFirst({
      where: {
        OR: [{ id }, { quotationNumber: id }],
      },
    });
  }

  /**
   * @param {string} quotationRequestId
   * @returns {Promise<object|null>} the most recent quotation for the request
   */
  async findByRequestId(quotationRequestId) {
    return prisma.quotation.findFirst({
      where: { quotationRequestId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * @param {Record<string, any>} data
   * @returns {Promise<object>}
   */
  async create(data) {
    return prisma.quotation.create({
      data: {
        quotationNumber: data.quotationNumber,
        quotationRequestId: data.quotationRequestId || null,
        companyId: data.companyId,
        companyName: data.companyName,
        contactPerson: data.contactPerson || null,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || null,
        status: data.status || "PENDING_REVIEW",
        tier: data.tier || "Enterprise",
        machineCount:
          data.machineCount !== undefined ? Number(data.machineCount) : 1,
        contractDuration: data.contractDuration || "12 Months",
        billingFrequency: data.billingFrequency || "Monthly in Advance",

        licensedMachineAllowance:
          data.licensedMachineAllowance !== undefined
            ? Number(data.licensedMachineAllowance)
            : 0,
        implementationFee:
          data.implementationFee !== undefined ? data.implementationFee : 0,
        monthlySiteLicence:
          data.monthlySiteLicence !== undefined ? data.monthlySiteLicence : 0,
        additionalMachineCharge:
          data.additionalMachineCharge !== undefined
            ? data.additionalMachineCharge
            : 0,

        trialRequested: data.trialRequested === true,
        trialDuration:
          data.trialDuration !== undefined && data.trialDuration !== null
            ? Number(data.trialDuration)
            : null,
        trialMachines:
          data.trialMachines !== undefined && data.trialMachines !== null
            ? Number(data.trialMachines)
            : null,
        trialDescription: data.trialDescription || null,

        baseAmount: data.baseAmount !== undefined ? data.baseAmount : 0,
        optionalServicesAmount:
          data.optionalServicesAmount !== undefined
            ? data.optionalServicesAmount
            : 0,
        discountAmount:
          data.discountAmount !== undefined ? data.discountAmount : 0,
        taxAmount: data.taxAmount !== undefined ? data.taxAmount : 0,
        totalAmount: data.totalAmount !== undefined ? data.totalAmount : 0,

        optionalServices: data.optionalServices || [],
        scopeOfWork: data.scopeOfWork || null,
        paymentTerms: data.paymentTerms || null,
        notes: data.notes || null,
        validUntil: data.validUntil || null,
        sentAt: data.sentAt || new Date(),
        acceptedAt: data.acceptedAt || null,
        rejectedAt: data.rejectedAt || null,
        signedBy: data.signedBy || null,
        signatureUrl: data.signatureUrl || null,
      },
    });
  }

  /**
   * Allow-list update — only fields in QUOTATION_UPDATABLE_FIELDS are
   * ever written, regardless of what `data` contains.
   *
   * @param {string} id
   * @param {Record<string, any>} data
   * @returns {Promise<object>}
   */
  async update(id, data) {
    const updateData = pickAllowed(data, QUOTATION_UPDATABLE_FIELDS);

    return prisma.quotation.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * @param {string} id
   * @returns {Promise<object>}
   */
  async delete(id) {
    return prisma.quotation.delete({ where: { id } });
  }

  // ===== CONTRACT FUNCTIONS =====

  /**
   * Looks up a contract by primary key or by its human-readable
   * contract number, with a trimmed-down nested quotation.
   *
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findContractById(id) {
    return prisma.contract.findFirst({
      where: { OR: [{ id }, { contractNumber: id }] },
      include: { quotation: { select: CONTRACT_QUOTATION_SELECT } },
    });
  }

  /**
   * @param {string} quotationId
   * @returns {Promise<object|null>}
   */
  async findContractByQuotationId(quotationId) {
    return prisma.contract.findFirst({ where: { quotationId } });
  }

  /**
   * @param {{ companyId?: string, status?: string }} [filter]
   * @returns {Promise<object[]>}
   */
  async findAllContracts(filter = {}) {
    const where = {};
    if (filter.companyId) where.companyId = filter.companyId;
    if (filter.status) where.status = filter.status;

    return prisma.contract.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { quotation: { select: CONTRACT_QUOTATION_SELECT } },
    });
  }

  /**
   * @param {Record<string, any>} data
   * @returns {Promise<object>}
   */
  async createContract(data) {
    return prisma.contract.create({
      data: {
        contractNumber: data.contractNumber,
        quotationId: data.quotationId,
        companyId: data.companyId,
        startDate: data.startDate,
        endDate: data.endDate,
        poNumber: data.poNumber || null,
        description: data.description || null,
        status: data.status || "SENT",
        sentAt: data.sentAt || null,
        superAdminSignatureUrl: data.superAdminSignatureUrl || null,
        superAdminSignedBy: data.superAdminSignedBy || null,
        superAdminSignedByUserId: data.superAdminSignedByUserId || null,
        superAdminSignedAt: data.superAdminSignedAt || null,
      },
      include: { quotation: { select: CONTRACT_QUOTATION_SELECT } },
    });
  }

  /**
   * Allow-list update — only fields in CONTRACT_UPDATABLE_FIELDS are
   * ever written, regardless of what `data` contains.
   *
   * @param {string} id
   * @param {Record<string, any>} data
   * @returns {Promise<object>}
   */
  async updateContract(id, data) {
    const updateData = pickAllowed(data, CONTRACT_UPDATABLE_FIELDS);

    return prisma.contract.update({
      where: { id },
      data: { ...updateData, updatedAt: new Date() },
      include: { quotation: { select: CONTRACT_QUOTATION_SELECT } },
    });
  }

     /**
     * @param {string} id
     * @returns {Promise<object>}
     */
    async deleteContract(id) {
        return prisma.contract.delete({ where: { id } });
    }

    // ===== INVOICE FUNCTIONS =====

    /**
     * Looks up a Contract with the nested company + quotation data needed
     * to auto-fill an invoice (bill-to, contract period, line item).
     *
     * @param {string} contractId
     * @returns {Promise<object|null>}
     */
    async findContractForInvoice(contractId) {
        return prisma.contract.findFirst({
            where: { OR: [{ id: contractId }, { contractNumber: contractId }] },
            select: INVOICE_CONTRACT_SELECT,
        });
    }

    /**
     * @param {{ companyId?: string, status?: string, contractId?: string, search?: string }} [filter]
     * @returns {Promise<object[]>}
     */
    async findAllInvoices(filter = {}) {
        const where = {};

        if (filter.companyId) where.companyId = filter.companyId;
        if (filter.status) where.status = filter.status;
        if (filter.contractId) where.contractId = filter.contractId;
        if (filter.search) {
            where.OR = [
                { invoiceNumber: { contains: filter.search, mode: 'insensitive' } },
                { billToName: { contains: filter.search, mode: 'insensitive' } },
                { contractNumber: { contains: filter.search, mode: 'insensitive' } },
            ];
        }

        return prisma.invoice.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Looks up an invoice by primary key or by its human-readable
     * invoice number.
     *
     * @param {string} id
     * @returns {Promise<object|null>}
     */
    async findInvoiceById(id) {
        return prisma.invoice.findFirst({
            where: { OR: [{ id }, { invoiceNumber: id }] },
        });
    }

    /**
     * @param {string} contractId
     * @returns {Promise<object|null>} the most recent invoice for the contract
     */
    async findInvoiceByContractId(contractId) {
        return prisma.invoice.findFirst({
            where: { contractId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * @param {Record<string, any>} data
     * @returns {Promise<object>}
     */
    async createInvoice(data) {
        return prisma.invoice.create({
            data: {
                invoiceNumber: data.invoiceNumber,
                contractId: data.contractId,
                companyId: data.companyId,
                quotationId: data.quotationId || null,

                billToName: data.billToName,
                billToAddress: data.billToAddress || null,
                billToGstin: data.billToGstin || null,

                issuerSnapshot: data.issuerSnapshot,
                bankDetailsSnapshot: data.bankDetailsSnapshot,

                contractNumber: data.contractNumber,
                quotationNumber: data.quotationNumber || null,
                contractPeriodStart: data.contractPeriodStart,
                contractPeriodEnd: data.contractPeriodEnd,

                lineItems: data.lineItems || [],
                subtotal: data.subtotal !== undefined ? data.subtotal : 0,
                totalAmount: data.totalAmount !== undefined ? data.totalAmount : 0,

                paymentTerms: data.paymentTerms || null,
                notes: data.notes || null,

                status: data.status || 'GENERATED',
                invoiceDate: data.invoiceDate || new Date(),
                dueDate: data.dueDate,

                pdfUrl: data.pdfUrl || null,
                createdById: data.createdById || null,
            },
        });
    }

    /**
     * Allow-list update — only fields in INVOICE_UPDATABLE_FIELDS are
     * ever written, regardless of what `data` contains.
     *
     * @param {string} id
     * @param {Record<string, any>} data
     * @returns {Promise<object>}
     */
    async updateInvoice(id, data) {
        const updateData = pickAllowed(data, INVOICE_UPDATABLE_FIELDS);

        return prisma.invoice.update({
            where: { id },
            data: {
                ...updateData,
                updatedAt: new Date(),
            },
        });
    }

    // ===== BILLING PROFILE FUNCTIONS (Super Admin's own bank details) =====

    /**
     * Returns the single active billing profile (Super Admin only
     * maintains one — the business they issue invoices from).
     *
     * @returns {Promise<object|null>}
     */
    async getActiveBillingProfile() {
        return prisma.billingProfile.findFirst({
            where: { isActive: true },
            orderBy: { updatedAt: 'desc' },
        });
    }

    /**
     * @param {string} id
     * @returns {Promise<object|null>}
     */
    async findBillingProfileById(id) {
        return prisma.billingProfile.findUnique({ where: { id } });
    }

    /**
     * @param {Record<string, any>} data
     * @returns {Promise<object>}
     */
    async createBillingProfile(data) {
        return prisma.billingProfile.create({ data });
    }

    /**
     * @param {string} id
     * @param {Record<string, any>} data
     * @returns {Promise<object>}
     */
    async updateBillingProfile(id, data) {
        return prisma.billingProfile.update({
            where: { id },
            data: { ...data, updatedAt: new Date() },
        });
    }

        // ===== PAYMENT PROOF FUNCTIONS =====

    /**
     * @param {Record<string, any>} data
     * @returns {Promise<object>}
     */
    async createPaymentProof(data) {
        return prisma.paymentProof.create({
            data: {
                invoiceId: data.invoiceId,
                invoiceNumber: data.invoiceNumber,
                companyId: data.companyId,

                submittedById: data.submittedById || null,
                submittedByName: data.submittedByName || null,
                submittedByEmail: data.submittedByEmail || null,

                paymentMethod: data.paymentMethod,
                paymentDate: data.paymentDate,
                amountPaid: data.amountPaid,
                transactionReference: data.transactionReference,
                proofFileUrl: data.proofFileUrl,
            },
        });
    }

    /**
     * @param {{ invoiceId?: string, companyId?: string }} [filter]
     * @returns {Promise<object[]>}
     */
    async findAllPaymentProofs(filter = {}) {
        const where = {};
        if (filter.invoiceId) where.invoiceId = filter.invoiceId;
        if (filter.companyId) where.companyId = filter.companyId;

        return prisma.paymentProof.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }

    
    async findPaymentProofById(id) {
        return prisma.paymentProof.findUnique({ where: { id } });
    }

    async updatePaymentProof(id, data) {
        const updateData = pickAllowed(data, PAYMENT_PROOF_UPDATABLE_FIELDS);

        return prisma.paymentProof.update({
            where: { id },
            data: updateData,
        });
    }

}

module.exports = new QuotationRepository();
