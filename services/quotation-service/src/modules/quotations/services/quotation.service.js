const crypto = require("crypto");
const prisma = require("../../../config/database");
const quotationRepository = require("../repositories/quotation.repository");
const quotationValidator = require("../validators/quotation.validator");
const quotationRequestRepository = require("../repositories/quotationRequest.repository");
const optionalServiceRepository = require("../../optional-services/repositories/optionalService.repository");
const quotationRequestValidator = require("../validators/quotationRequest.validator");

const isSuperAdmin = (user) => {
  if (!user) return false;
  if (user.isSuperAdmin === true) return true;
  const role = String(user.role || user.roleName || user.role_name || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  return role === "superadmin";
};

const generateAlphanumericCode = (length = 4) => {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
};

// Helper to get current Date string in YYYYMMDD format
const getFormattedDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

class QuotationService {
  async generateRequestId() {
    const dateStr = getFormattedDate();
    const suffix = generateAlphanumericCode(4);
    return `REQ-${dateStr}-${suffix}`;
  }

  async createQuotationRequest(data, user) {
    const validated = quotationRequestValidator.validateCreate(data);

    let companyId = user?.companyId || data.companyId || null;
    let companyName = validated.companyName || user?.companyName || null;
    let email = validated.email || user?.email || null;
    let contactPerson =
      validated.contactPerson ||
      (user?.firstName
        ? `${user.firstName} ${user.lastName || ""}`.trim()
        : null);
    let phone = validated.phone || user?.mobileNumber || null;

    if (companyId && !companyName) {
      try {
        const company = await prisma.company.findUnique({
          where: { id: companyId },
        });
        if (company) {
          companyName = company.name;
        }
      } catch (e) {}
    }
    if (user?.id && (!contactPerson || !phone || !email)) {
      try {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (dbUser) {
          if (!contactPerson)
            contactPerson =
              `${dbUser.firstName} ${dbUser.lastName || ""}`.trim();
          if (!phone) phone = dbUser.mobileNumber;
          if (!email) email = dbUser.email;
        }
      } catch (e) {}
    }

    const isTrialRequest =
      (validated.quotationType &&
        (validated.quotationType.toLowerCase().includes("trial") ||
          validated.quotationType.toLowerCase().includes("demo"))) ||
      data.tierCode === "TRIAL";

    if (isTrialRequest && companyId) {
      const existingDemo = await prisma.quotationRequest.findFirst({
        where: {
          companyId,
          OR: [
            { quotationType: { contains: "Trial", mode: "insensitive" } },
            { quotationType: { contains: "Demo", mode: "insensitive" } },
          ],
        },
      });

      if (existingDemo) {
        const err = new Error(
          "Your company has already requested or claimed a Free Demo Trial. Only one Demo trial is allowed per company.",
        );
        err.statusCode = 400;
        throw err;
      }
    }

    const requestId = await this.generateRequestId();

    return quotationRequestRepository.create({
      ...validated,
      requestId,
      userId: user?.id || data.userId || null,
      companyId,
      companyName,
      contactPerson,
      email,
      phone,
      status: data.status || "PENDING",
    });
  }

  async getQuotationRequests(user, query = {}) {
    const filter = { ...query };
    if (user?.companyId && !isSuperAdmin(user)) {
      filter.companyId = user.companyId;
    }
    return quotationRequestRepository.findAll(filter);
  }

  async getQuotationRequestById(id, user) {
    const req = await quotationRequestRepository.findById(id);
    if (!req) throw new Error("Quotation request not found");
    if (
      user?.companyId &&
      !isSuperAdmin(user) &&
      req.companyId !== user.companyId
    ) {
      throw new Error("Unauthorized to view this quotation request");
    }
    return req;
  }

  async updateQuotationRequest(id, data, user) {
    const req = await this.getQuotationRequestById(id, user);
    const updated = await quotationRequestRepository.update(req.id, data);

    if (
      (data.status === "APPROVED" ||
        data.status === "SENT" ||
        data.status === "ACCEPTED") &&
      req.companyId
    ) {
      try {
        await prisma.company.update({
          where: { id: req.companyId },
          data: { subscriptionStatus: "active" },
        });
      } catch (e) {}
    }

    return updated;
  }

  async deleteQuotationRequest(id, user) {
    const req = await this.getQuotationRequestById(id, user);
    return quotationRequestRepository.delete(req.id);
  }

  async generateQuotationNumber() {
    const dateStr = getFormattedDate();
    const suffix = generateAlphanumericCode(4);
    return `QT-${dateStr}-${suffix}`;
  }

  async getQuotations(user, query = {}) {
    const filter = { ...query };
    if (user?.companyId && !isSuperAdmin(user)) {
      filter.companyId = user.companyId;
    }
    return quotationRepository.findAll(filter);
  }

  async getQuotationById(id, user) {
    const quote = await quotationRepository.findById(id);
    if (!quote) throw new Error("Quotation not found");
    if (
      user?.companyId &&
      !isSuperAdmin(user) &&
      quote.companyId !== user.companyId
    ) {
      throw new Error("Unauthorized to view this quotation");
    }
    return quote;
  }

  async requestQuotation(data, user) {
    const companyId = user?.companyId || data.companyId || null;
    const companyName = user?.companyName || data.companyName || null;
    const quotationNumber = await this.generateQuotationNumber();

    const baseAmount = Number(data.baseAmount) || 0;
    const optionalServicesAmount = Number(data.optionalServicesAmount) || 0;
    const discountAmount = Number(data.discountAmount) || 0;
    const totalAmount =
      Number(data.totalAmount) ||
      Math.max(0, baseAmount + optionalServicesAmount - discountAmount);

    return quotationRepository.create({
      quotationNumber,
      companyId,
      companyName,
      contactPerson: data.contactPerson || user?.name || null,
      contactEmail: data.contactEmail || user?.email || null,
      contactPhone: data.contactPhone || null,
      status: "PENDING_REVIEW",
      tier: data.tier || null,
      machineCount:
        data.machineCount !== undefined ? Number(data.machineCount) : null,
      contractDuration: data.contractDuration
        ? String(data.contractDuration)
        : null,
      billingFrequency: data.billingFrequency || null,
      baseAmount,
      optionalServicesAmount,
      discountAmount,
      totalAmount,
      optionalServices: data.optionalServices || [],
      notes: data.notes || null,
    });
  }

  /**
   * POST /quotations/send
   * Super Admin fills the SendQuotationDrawer form (Commercial Details,
   * Trial Option, Additional Services, Notes) and sends the official
   * quotation against the client's original QuotationRequest.
   *
   * The payload shape here matches `QuotationDraft` on the frontend
   * exactly — licensedMachineAllowance, implementationFee,
   * monthlySiteLicence, additionalMachineCharge, trial fields, and
   * services as { serviceId, selected, price } — nothing generic.
   */
  async sendQuotation(data, user) {
    const validated = quotationValidator.validateSend(data);

    const quotationNumber =
      data.quotationNumber || (await this.generateQuotationNumber());

    // If sent against a real inquiry, verify it exists and access is allowed.
    let linkedRequest = null;
    if (validated.quotationRequestId) {
      linkedRequest = await quotationRequestRepository.findById(
        validated.quotationRequestId,
      );
      if (!linkedRequest) {
        throw new Error(
          `Quotation request ${validated.quotationRequestId} was not found`,
        );
      }
      if (
        user?.companyId &&
        !isSuperAdmin(user) &&
        linkedRequest.companyId !== user.companyId
      ) {
        throw new Error("Unauthorized to send a quotation for this request");
      }
    }

    const isTrial = validated.trialRequested;

    const quotation = await quotationRepository.create({
      ...validated,
      quotationNumber,
      status: isTrial ? "ACTIVATED" : "SENT",
      sentAt: new Date(),
    });

    // Keep the originating inquiry's lifecycle status in sync.
    if (linkedRequest) {
      await quotationRequestRepository.update(linkedRequest.id, {
        status: isTrial ? "APPROVED" : "SENT",
      });

      if (isTrial && linkedRequest.companyId) {
        try {
          await prisma.company.update({
            where: { id: linkedRequest.companyId },
            data: { subscriptionStatus: "active" },
          });
        } catch (e) {}
      }
    }

    return quotation;
  }

  async createAddonQuotation(data, user) {
    const quotationNumber = await this.generateQuotationNumber();
    const companyId =
      data.companyId ||
      user?.companyId ||
      "HME-COMP-" + generateAlphanumericCode(4);
    const companyName =
      data.companyName || user?.companyName || "Valued Client";

    const machineCount =
      Number(data.machineCount) || Number(data.extraMachines) || 1;
    const ratePerMachine = Number(data.ratePerMachine) || 1500;
    const durationMonths =
      Number(data.contractDuration || data.durationMonths) || 12;
    const baseAmount =
      Number(data.baseAmount) || machineCount * ratePerMachine * durationMonths;
    const optionalServicesAmount = Number(data.optionalServicesAmount) || 0;
    const discountAmount = Number(data.discountAmount) || 0;
    const taxRate = Number(data.taxRate) || 0.15;
    const subtotal = Math.max(
      0,
      baseAmount + optionalServicesAmount - discountAmount,
    );
    const taxAmount =
      Number(data.taxAmount) || Math.round(subtotal * taxRate * 100) / 100;
    const totalAmount = Number(data.totalAmount) || subtotal + taxAmount;

    const paymentMethod = data.paymentMethod || "EFT";
    const eftReferenceNumber =
      data.eftReferenceNumber || `EFT-${quotationNumber}`;

    const scopeOfWorkData = {
      quotationType: data.quotationType || "MACHINE_ADDON",
      extraMachines: machineCount,
      machineTypes: data.machineTypes || [],
      extraSites: data.extraSites || 0,
      siteNames: data.siteNames || [],
      paymentMethod,
      eftReferenceNumber,
      proofOfPaymentUrl: data.proofOfPaymentUrl || null,
      bankDetails: {
        bankName: "First National Bank (FNB)",
        accountName: "HME Intelligence (Pty) Ltd",
        accountNumber: "62894109823",
        branchCode: "250655",
        accountType: "Current / Cheque",
        referenceCode: eftReferenceNumber,
      },
      createdBy: user?.name || user?.email || "Super Admin",
      notes: data.notes || "",
    };

    return quotationRepository.create({
      quotationNumber,
      companyId,
      companyName,
      contactPerson: data.contactPerson || user?.name || null,
      contactEmail: data.contactEmail || user?.email || "finance@client.com",
      contactPhone: data.contactPhone || null,
      status:
        data.status || (data.proofOfPaymentUrl ? "EFT_SUBMITTED" : "ISSUED"),
      tier: data.tier || "Add-on Fleet Expansion",
      machineCount,
      contractDuration: String(durationMonths),
      billingFrequency: data.billingFrequency || "Monthly in Advance",
      baseAmount,
      optionalServicesAmount,
      discountAmount,
      taxAmount,
      totalAmount,
      optionalServices: data.optionalServices || [],
      scopeOfWork: scopeOfWorkData,
      paymentTerms: `Payment via ${paymentMethod} within 14 days. Ref: ${eftReferenceNumber}`,
      notes: data.notes || `Machine add-on quote for ${machineCount} unit(s).`,
      sentAt: new Date(),
      validUntil: data.validUntil
        ? new Date(data.validUntil)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }

  async submitEftPayment(id, data, user) {
    const quote = await this.getQuotationById(id, user);

    const currentScope =
      quote.scopeOfWork && typeof quote.scopeOfWork === "object"
        ? quote.scopeOfWork
        : {};
    const updatedScope = {
      ...currentScope,
      paymentMethod: "EFT",
      eftReferenceNumber:
        data.eftReferenceNumber ||
        currentScope.eftReferenceNumber ||
        `EFT-${quote.quotationNumber}`,
      proofOfPaymentUrl:
        data.proofOfPaymentUrl || data.popUrl || currentScope.proofOfPaymentUrl,
      eftSubmittedAt: new Date().toISOString(),
      eftSubmittedBy: user?.name || user?.email || "Client User",
      submissionNotes: data.notes || "",
    };

    return quotationRepository.update(quote.id, {
      status: "EFT_SUBMITTED",
      scopeOfWork: updatedScope,
      notes: data.notes
        ? `${quote.notes ? quote.notes + " | " : ""}EFT Submitted: ${data.notes}`
        : quote.notes,
    });
  }

  async verifyEftPayment(id, data, user) {
    const quote = await this.getQuotationById(id, user);
    const action = String(data.action || "APPROVE").toUpperCase();

    const currentScope =
      quote.scopeOfWork && typeof quote.scopeOfWork === "object"
        ? quote.scopeOfWork
        : {};
    const isApproved = action === "APPROVE";

    const updatedScope = {
      ...currentScope,
      paymentVerifiedAt: new Date().toISOString(),
      paymentVerifiedBy: user?.name || user?.email || "Super Admin",
      verificationStatus: isApproved ? "APPROVED" : "REJECTED",
      verificationNotes: data.notes || "",
    };

    return quotationRepository.update(quote.id, {
      status: isApproved ? "PAID" : "REJECTED",
      scopeOfWork: updatedScope,
      acceptedAt: isApproved ? new Date() : quote.acceptedAt,
      notes: `${quote.notes ? quote.notes + " | " : ""}EFT ${isApproved ? "Approved & Paid" : "Rejected"}: ${data.notes || "By Admin"}`,
    });
  }

  async acceptQuotation(id, data, user) {
    const quote = await this.getQuotationById(id, user);

    if (quote.status !== "SENT") {
      throw new Error(
        `Quotation cannot be accepted. Current status: ${quote.status}`,
      );
    }

    if (!data?.signedBy || typeof data.signedBy !== "string") {
      throw new Error("signedBy is required");
    }

    return quotationRepository.update(quote.id, {
      status: "ACCEPTED",
      acceptedAt: new Date(),
      signedBy: data.signedBy.trim(),
    });
  }

  async rejectQuotation(id, data, user) {
    const quote = await this.getQuotationById(id, user);

    if (quote.status !== "SENT") {
      throw new Error(
        `Quotation cannot be rejected. Current status: ${quote.status}`,
      );
    }

    return quotationRepository.update(quote.id, {
      status: "REJECTED",
      rejectedAt: new Date(),
    });
  }

  // ===== CONTRACT FUNCTIONS =====

  async generateContractNumber() {
    const dateStr = getFormattedDate();
    const suffix = generateAlphanumericCode(4);
    return `CNT-${dateStr}-${suffix}`;
  }

  async getContracts(user, query = {}) {
    const filter = { ...query };
    if (user?.companyId && !isSuperAdmin(user)) {
      filter.companyId = user.companyId;
    }
    return quotationRepository.findAllContracts(filter);
  }

  async getContractById(id, user) {
    const contract = await quotationRepository.findContractById(id);
    if (!contract) throw new Error("Contract not found");
    if (
      user?.companyId &&
      !isSuperAdmin(user) &&
      contract.companyId !== user.companyId
    ) {
      throw new Error("Unauthorized to view this contract");
    }
    return contract;
  }

  async createContract(data, user) {
    const validated = quotationValidator.validateCreateContract(data);

    const quote = await quotationRepository.findById(validated.quotationId);
    if (!quote) {
      throw new Error("Quotation not found");
    }
    if (quote.status !== "ACCEPTED") {
      throw new Error(
        `Contract can only be created for an ACCEPTED quotation. Current status: ${quote.status}`,
      );
    }

    const existingContract =
      await quotationRepository.findContractByQuotationId(quote.id);
    if (existingContract) {
      throw new Error("A contract already exists for this quotation");
    }

    const contractNumber = await this.generateContractNumber();

    return quotationRepository.createContract({
      ...validated,
      contractNumber,
      companyId: quote.companyId,
      status: "SENT",
      sentAt: new Date(),
      superAdminSignedByUserId: user?.id || null,
      superAdminSignedAt: new Date(),
    });
    await quotationRepository.update(quote.id, {
      status: "CONTRACT_CREATED",
    });

    return contract;
  }

  async updateContract(id, data, user) {
    await this.getContractById(id, user);
    const validated = quotationValidator.validateUpdateContract(data);
    return quotationRepository.updateContract(id, validated);
  }

  async deleteContract(id, user) {
    await this.getContractById(id, user);
    return quotationRepository.deleteContract(id);
  }
  async acceptContract(id, data, user) {
    const contract = await this.getContractById(id, user);

    if (contract.status !== "SENT") {
      throw new Error(
        `Contract cannot be accepted. Current status: ${contract.status}`,
      );
    }

    // Super Admin signature must already exist before company can accept
    if (!contract.superAdminSignatureUrl) {
      throw new Error(
        "Contract cannot be accepted: Super Admin signature is missing",
      );
    }

    if (!data.signatureUrl) {
      throw new Error("Digital signature is required to accept a contract");
    }

    const validated = quotationValidator.validateAcceptContract(data);

    return quotationRepository.updateContract(contract.id, {
      status: "ACCEPTED",
      companySignatureUrl: data.signatureUrl,
      companySignedBy: validated.signedBy,
      companySignedByUserId: user?.id || null,
      companySignedAt: new Date(),
      acceptanceDescription: validated.acceptanceDescription,
    });
  }

  async rejectContract(id, data, user) {
    const contract = await this.getContractById(id, user);

    if (contract.status !== "SENT") {
      throw new Error(
        `Contract cannot be rejected. Current status: ${contract.status}`,
      );
    }

    const validated = quotationValidator.validateRejectContract(data);

    return quotationRepository.updateContract(contract.id, {
      status: "REJECTED",
      rejectionReason: validated.rejectionReason,
      rejectedBy: user?.name || user?.email || null,
      rejectedByUserId: user?.id || null,
      rejectedAt: new Date(),
    });
  }

  // ===== INVOICE FUNCTIONS =====

  async generateInvoiceNumber() {
    const dateStr = getFormattedDate();
    const suffix = generateAlphanumericCode(4);
    return `INV-${dateStr}-${suffix}`;
  }

  async createInvoice(data, user) {
    const validated = quotationValidator.validateCreateInvoice(data);

    const contract = await quotationRepository.findContractForInvoice(
      validated.contractId,
    );
    if (!contract) {
      throw new Error("Contract not found");
    }

    if (!isSuperAdmin(user)) {
      throw new Error("Unauthorized to generate an invoice");
    }

    const quotation = contract.quotation || null;

    const billingProfile = await quotationRepository.getActiveBillingProfile();
    if (!billingProfile) {
      throw new Error(
        "No billing profile configured. Please set up your bank/business details first.",
      );
    }

    let lineItems = validated.lineItems;
    if (lineItems.length === 0) {
      const implementationFee = Number(quotation?.implementationFee || 0);
      const monthlySiteLicence = Number(quotation?.monthlySiteLicence || 0);
      const additionalMachineCharge = Number(
        quotation?.additionalMachineCharge || 0,
      );
      const optionalServices = Array.isArray(quotation?.optionalServices)
        ? quotation.optionalServices
        : [];

      const startDate = new Date(contract.startDate);
      const endDate = new Date(contract.endDate);
      const monthsRaw =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());
      const months =
        Number.isFinite(monthsRaw) && monthsRaw > 0 ? monthsRaw : 1;

      const recurringUnitPrice = monthlySiteLicence + additionalMachineCharge;

      lineItems = [];

      if (implementationFee > 0) {
        lineItems.push({
          description: "One-time Implementation Fee",
          quantity: 1,
          unitPrice: implementationFee,
          amount: Math.round(implementationFee * 100) / 100,
        });
      }

      if (recurringUnitPrice > 0) {
        lineItems.push({
          description: `Monthly Site Licence & Additional Machine Charge (${months} month${months > 1 ? "s" : ""})`,
          quantity: months,
          unitPrice: recurringUnitPrice,
          amount: Math.round(recurringUnitPrice * months * 100) / 100,
        });
      }

      for (const service of optionalServices) {
        const price = Number(service?.price || 0);
        if (price > 0) {
          lineItems.push({
            description: service?.name
              ? String(service.name)
              : "Additional Service",
            quantity: 1,
            unitPrice: price,
            amount: Math.round(price * 100) / 100,
          });
        }
      }

      if (lineItems.length === 0) {
        lineItems = [
          {
            description: `Services as per contract ${contract.contractNumber}`,
            quantity: quotation?.machineCount || 1,
            unitPrice: 0,
            amount: 0,
          },
        ];
      }
    }

    const subtotal = lineItems.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );
    const totalAmount = subtotal;

    const invoiceDate = new Date();
    const dueDate =
      validated.dueDate ||
      new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const invoiceNumber = await this.generateInvoiceNumber();

    const issuerSnapshot = {
      businessName: billingProfile.businessName,
      addressLine: billingProfile.addressLine,
      gstin: billingProfile.gstin,
      phone: billingProfile.phone,
      email: billingProfile.email,
    };

    const bankDetailsSnapshot = {
      bankName: billingProfile.bankName,
      accountHolderName: billingProfile.accountHolderName,
      accountNumber: billingProfile.accountNumber,
      ifscCode: billingProfile.ifscCode,
      branch: billingProfile.branch,
    };

    const invoice = await quotationRepository.createInvoice({
      invoiceNumber,
      contractId: contract.id,
      companyId: contract.companyId,
      quotationId: contract.quotationId || null,

      billToName: contract.company?.name || quotation?.companyName || "N/A",
      billToAddress: null,
      billToGstin: null,

      issuerSnapshot,
      bankDetailsSnapshot,

      contractNumber: contract.contractNumber,
      quotationNumber: quotation?.quotationNumber || null,
      contractPeriodStart: contract.startDate,
      contractPeriodEnd: contract.endDate,

      lineItems,
      subtotal,
      totalAmount,

      paymentTerms: validated.paymentTerms,
      notes: validated.notes,

      status: "GENERATED",
      invoiceDate,
      dueDate,

      createdById: user?.id || null,
    });

    return invoice;
  }

  async getInvoices(user, query = {}) {
    const filter = { ...query };
    if (user?.companyId && !isSuperAdmin(user)) {
      filter.companyId = user.companyId;
    }
    return quotationRepository.findAllInvoices(filter);
  }

  async getInvoiceById(id, user) {
    const invoice = await quotationRepository.findInvoiceById(id);
    if (!invoice) throw new Error("Invoice not found");
    if (
      user?.companyId &&
      !isSuperAdmin(user) &&
      invoice.companyId !== user.companyId
    ) {
      throw new Error("Unauthorized to view this invoice");
    }
    return invoice;
  }

  async submitInvoicePaymentProof(id, data, user) {
    const invoice = await this.getInvoiceById(id, user);

    const validated = quotationValidator.validateSubmitPaymentProof(data);

    if (!data.proofFileUrl) {
      throw new Error("Payment proof file is required");
    }

    return quotationRepository.createPaymentProof({
      ...validated,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      companyId: invoice.companyId,
      proofFileUrl: data.proofFileUrl,
      submittedById: user?.id || null,
      submittedByName:
        user?.name ||
        (user?.firstName
          ? `${user.firstName} ${user.lastName || ""}`.trim()
          : null),
      submittedByEmail: user?.email || null,
    });
  }

  async verifyPaymentProof(id, data, user) {
    if (!isSuperAdmin(user)) {
      throw new Error("Unauthorized to verify payment proofs");
    }

    const proof = await quotationRepository.findPaymentProofById(id);
    if (!proof) {
      throw new Error("Payment proof not found");
    }

    if (proof.status === "PAID") {
      throw new Error("This payment proof has already been verified");
    }

    const validated = quotationValidator.validateVerifyPaymentProof(data);

    const updatedProof = await quotationRepository.updatePaymentProof(
      proof.id,
      {
        status: "PAID",
        verifiedAt: new Date(),
        verifiedBy: user?.name || user?.email || null,
        verifiedByUserId: user?.id || null,
      },
    );

    await quotationRepository.updateInvoice(proof.invoiceId, {
      status: "PAID",
    });

    return updatedProof;
  }

  async getPaymentProofs(user, query = {}) {
    if (!isSuperAdmin(user)) {
      throw new Error("Unauthorized to view payment proofs");
    }
    const filter = { ...query };
    return quotationRepository.findAllPaymentProofs(filter);
  }

  //BILLING PROFILE FUNCTIONS

  async getBillingProfile(user) {
    if (!isSuperAdmin(user)) {
      throw new Error("Unauthorized to view billing profile");
    }
    return quotationRepository.getActiveBillingProfile();
  }

  async upsertBillingProfile(data, user) {
    if (!isSuperAdmin(user)) {
      throw new Error("Unauthorized to manage billing profile");
    }

    const validated = quotationValidator.validateBillingProfile(data);
    const existing = await quotationRepository.getActiveBillingProfile();

    if (existing) {
      return quotationRepository.updateBillingProfile(existing.id, validated);
    }
    return quotationRepository.createBillingProfile(validated);
  }
}

module.exports = new QuotationService();
