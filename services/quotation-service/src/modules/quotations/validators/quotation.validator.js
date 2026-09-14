const VALID_TIERS = ['Once-Off Implementation Fee', 'Fixed Monthly Site Licence', 'Add-on Fleet Expansion'];

function toNonNegative(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function toPositiveIntOrNull(value) {
    if (value === undefined || value === null || value === '') return null;
    const n = Math.round(Number(value));
    return Number.isFinite(n) && n >= 0 ? n : null;
}

class QuotationValidator {
    /**
     * Validates payload for POST /quotations/send.
     * Field names mirror the actual `QuotationDraft` shape used by the
     * SendQuotationDrawer form on the frontend — not a generic
     * base/discount/tax invoice shape.
     */
    validateSend(data = {}) {
        // 1. Link back to the client's original inquiry (recommended, not forced —
        // add-on / manual quotations may not have one).
        const quotationRequestId =
            data.quotationRequestId && typeof data.quotationRequestId === 'string' && data.quotationRequestId.trim()
                ? data.quotationRequestId.trim()
                : null;

        // 2. Company / contact — required
        if (!data.companyId || typeof data.companyId !== 'string' || !data.companyId.trim()) {
            throw new Error('companyId is required');
        }
        if (!data.companyName || typeof data.companyName !== 'string' || !data.companyName.trim()) {
            throw new Error('companyName is required');
        }
        if (!data.contactEmail || typeof data.contactEmail !== 'string' || !data.contactEmail.trim()) {
            throw new Error('contactEmail is required');
        }
        const contactEmail = data.contactEmail.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
            throw new Error('Please provide a valid contactEmail');
        }

       
       const tier = data.tier && VALID_TIERS.includes(data.tier) ? data.tier : 'Once-Off Implementation Fee';

        let machineCount = 1;
        if (data.machineCount !== undefined && data.machineCount !== null) {
            machineCount = Number(data.machineCount);
            if (isNaN(machineCount) || machineCount < 1 || !Number.isInteger(machineCount)) {
                throw new Error('machineCount must be a positive integer (at least 1)');
            }
        }

        const contractDuration = data.contractDuration ? String(data.contractDuration).trim() : '12 Months';
        const billingFrequency = data.billingFrequency ? String(data.billingFrequency).trim() : 'Monthly in Advance';

        // 4. Commercial Details section — same fields as CommercialDetailsSection.tsx
        if (data.licensedMachineAllowance === undefined || data.licensedMachineAllowance === null) {
            throw new Error('licensedMachineAllowance is required');
        }
        const licensedMachineAllowance = toPositiveIntOrNull(data.licensedMachineAllowance);
        if (licensedMachineAllowance === null || licensedMachineAllowance <= 0) {
            throw new Error('licensedMachineAllowance must be a positive integer');
        }

        const implementationFee = toNonNegative(data.implementationFee ?? data.onceOffImplementationFee, 0);
        const monthlySiteLicence = toNonNegative(data.monthlySiteLicence, 0);
        const additionalMachineCharge = toNonNegative(data.additionalMachineCharge, 0);

        if (!data.paymentTerms || typeof data.paymentTerms !== 'string' || !data.paymentTerms.trim()) {
            throw new Error('paymentTerms is required');
        }
        const paymentTerms = data.paymentTerms.trim();

        // 5. Trial Option section — same fields as TrialOptionSection.tsx
        const trialRequested = data.trialRequested === true;
        let trialDuration = null;
        let trialMachines = null;
        let trialDescription = null;
        if (trialRequested) {
            trialDuration = toPositiveIntOrNull(data.trialDuration);
            if (trialDuration === null || trialDuration <= 0) {
                throw new Error('trialDuration is required when trialRequested is true');
            }
            trialMachines = toPositiveIntOrNull(data.trialMachines);
            if (trialMachines === null || trialMachines <= 0) {
                throw new Error('trialMachines is required when trialRequested is true');
            }
            trialDescription = data.trialDescription ? String(data.trialDescription).trim() : null;
        }

        // 6. Additional Services section — same shape as SelectedService[]
        // { serviceId, selected, price } — only selected ones are sent/stored.
        let optionalServices = [];
        if (data.services !== undefined || data.optionalServices !== undefined) {
            const raw = Array.isArray(data.services)
                ? data.services
                : Array.isArray(data.optionalServices)
                    ? data.optionalServices
                    : [];
            optionalServices = raw
                .filter((s) => s && s.selected !== false)
                .map((s) => {
                    if (!s.serviceId) {
                        throw new Error('Each service entry requires a serviceId');
                    }
                    return {
                        serviceId: String(s.serviceId),
                        name: s.name ? String(s.name) : null,
                        price: toNonNegative(s.price, 0),
                    };
                });
        }
        const additionalServicesTotal = optionalServices.reduce((sum, s) => sum + s.price, 0);

        // 7. Totals — computed the same way as computeQuotationTotals() on
        // the frontend, so backend and UI never disagree.
        const oneTimeTotal = implementationFee + additionalServicesTotal;
        const monthlyRecurringTotal = monthlySiteLicence + additionalMachineCharge;
        const contractMonthsMatch = /^(\d+)/.exec(contractDuration);
        const contractMonths = contractMonthsMatch ? parseInt(contractMonthsMatch[1], 10) : 0;
        const contractValue = oneTimeTotal + monthlyRecurringTotal * contractMonths;

        // 8. Description / Notes + validity
        const notes = data.notes ? String(data.notes).trim() : null;
        let validUntil = null;
        if (data.validUntil) {
            const d = new Date(data.validUntil);
            if (isNaN(d.getTime())) {
                throw new Error('validUntil must be a valid date');
            }
            validUntil = d;
        }

               return {
            quotationRequestId,
            companyId: data.companyId.trim(),
            companyName: data.companyName.trim(),
            contactPerson: data.contactPerson ? String(data.contactPerson).trim() : null,
            contactEmail,
            contactPhone: data.contactPhone ? String(data.contactPhone).trim() : null,
            tier,
            machineCount,
            contractDuration,
            billingFrequency,
            licensedMachineAllowance,
            implementationFee,
            monthlySiteLicence,
            additionalMachineCharge,
            paymentTerms,
            trialRequested,
            trialDuration,
            trialMachines,
            trialDescription,
            optionalServices,
            baseAmount: implementationFee,
            optionalServicesAmount: additionalServicesTotal,
            discountAmount: toNonNegative(data.discountAmount, 0),
            taxAmount: toNonNegative(data.taxAmount, 0),
            totalAmount: contractValue,
            notes,
            validUntil,
        };
    }

        validateCreateContract(data = {}) {
        if (!data.quotationId || typeof data.quotationId !== 'string' || !data.quotationId.trim()) {
            throw new Error('quotationId is required');
        }
        if (!data.startDate) {
            throw new Error('startDate is required');
        }
        const startDate = new Date(data.startDate);
        if (isNaN(startDate.getTime())) {
            throw new Error('startDate must be a valid date');
        }
        if (!data.endDate) {
            throw new Error('endDate is required');
        }
        const endDate = new Date(data.endDate);
        if (isNaN(endDate.getTime())) {
            throw new Error('endDate must be a valid date');
        }
        if (endDate <= startDate) {
            throw new Error('endDate must be after startDate');
        }

        // Super Admin signature — mandatory at contract creation
        if (!data.superAdminSignatureUrl) {
            throw new Error('Super Admin signature is required to create a contract');
        }
        if (!data.superAdminSignedBy || typeof data.superAdminSignedBy !== 'string' || !data.superAdminSignedBy.trim()) {
            throw new Error('superAdminSignedBy is required');
        }

        return {
            quotationId: data.quotationId.trim(),
            startDate,
            endDate,
            poNumber: data.poNumber ? String(data.poNumber).trim() : null,
            description: data.description ? String(data.description).trim() : null,
            superAdminSignatureUrl: data.superAdminSignatureUrl,
            superAdminSignedBy: data.superAdminSignedBy.trim(),
        };
    }

    validateUpdateContract(data = {}) {
        const validated = {};

        if (data.startDate !== undefined) {
            const startDate = new Date(data.startDate);
            if (isNaN(startDate.getTime())) throw new Error('startDate must be a valid date');
            validated.startDate = startDate;
        }
        if (data.endDate !== undefined) {
            const endDate = new Date(data.endDate);
            if (isNaN(endDate.getTime())) throw new Error('endDate must be a valid date');
            validated.endDate = endDate;
        }
        if (validated.startDate && validated.endDate && validated.endDate <= validated.startDate) {
            throw new Error('endDate must be after startDate');
        }
        if (data.poNumber !== undefined) validated.poNumber = data.poNumber ? String(data.poNumber).trim() : null;
        if (data.description !== undefined) validated.description = data.description ? String(data.description).trim() : null;
        if (data.status !== undefined) validated.status = data.status;

        return validated;
    }

        validateAcceptContract(data = {}) {
        if (!data.signedBy || typeof data.signedBy !== 'string' || !data.signedBy.trim()) {
            throw new Error('signedBy is required');
        }
        return {
            signedBy: data.signedBy.trim(),
            acceptanceDescription: data.acceptanceDescription
                ? String(data.acceptanceDescription).trim()
                : null,
        };
    }

       validateRejectContract(data = {}) {
        if (!data.rejectionReason || typeof data.rejectionReason !== 'string' || !data.rejectionReason.trim()) {
            throw new Error('rejectionReason is required');
        }
        return { rejectionReason: data.rejectionReason.trim() };
    }

    // ===== INVOICE VALIDATORS =====

    /**
     * Validates payload for POST /invoices.
     * Super Admin only sends a contractId (+ optional line items/notes) —
     * everything else (company, quotation, bank details) is pulled from
     * the DB inside the service layer.
     */
    validateCreateInvoice(data = {}) {
        if (!data.contractId || typeof data.contractId !== 'string' || !data.contractId.trim()) {
            throw new Error('contractId is required');
        }

        // Optional: Super Admin can override auto line items, else service
        // builds a single line item from the contract's linked quotation.
        let lineItems = [];
        if (data.lineItems !== undefined) {
            if (!Array.isArray(data.lineItems) || data.lineItems.length === 0) {
                throw new Error('lineItems must be a non-empty array when provided');
            }
            lineItems = data.lineItems.map((item, idx) => {
                if (!item.description || typeof item.description !== 'string' || !item.description.trim()) {
                    throw new Error(`lineItems[${idx}].description is required`);
                }
                const quantity = toNonNegative(item.quantity, 1);
                const unitPrice = toNonNegative(item.unitPrice, 0);
                if (quantity <= 0) {
                    throw new Error(`lineItems[${idx}].quantity must be greater than 0`);
                }
                return {
                    description: item.description.trim(),
                    quantity,
                    unitPrice,
                    amount: Math.round(quantity * unitPrice * 100) / 100,
                };
            });
        }

        let dueDate = null;
        if (data.dueDate) {
            const d = new Date(data.dueDate);
            if (isNaN(d.getTime())) {
                throw new Error('dueDate must be a valid date');
            }
            dueDate = d;
        }

        const paymentTerms = data.paymentTerms
            ? String(data.paymentTerms).trim()
            : 'Payment is due within 30 days from the invoice date.';

        const notes = data.notes ? String(data.notes).trim() : null;

        return {
            contractId: data.contractId.trim(),
            lineItems, // empty array => service auto-builds from contract/quotation
            dueDate,   // null => service defaults to invoiceDate + 30 days
            paymentTerms,
            notes,
        };
    }

    /**
     * Validates payload for POST /billing-profile (Super Admin's own
     * business + bank details, used to stamp every invoice).
     */
    validateBillingProfile(data = {}) {
        if (!data.businessName || typeof data.businessName !== 'string' || !data.businessName.trim()) {
            throw new Error('businessName is required');
        }
        if (!data.addressLine || typeof data.addressLine !== 'string' || !data.addressLine.trim()) {
            throw new Error('addressLine is required');
        }
        if (!data.bankName || typeof data.bankName !== 'string' || !data.bankName.trim()) {
            throw new Error('bankName is required');
        }
        if (!data.accountHolderName || typeof data.accountHolderName !== 'string' || !data.accountHolderName.trim()) {
            throw new Error('accountHolderName is required');
        }
        if (!data.accountNumber || typeof data.accountNumber !== 'string' || !data.accountNumber.trim()) {
            throw new Error('accountNumber is required');
        }
        if (!data.ifscCode || typeof data.ifscCode !== 'string' || !data.ifscCode.trim()) {
            throw new Error('ifscCode is required');
        }

        return {
            businessName: data.businessName.trim(),
            addressLine: data.addressLine.trim(),
            gstin: data.gstin ? String(data.gstin).trim() : null,
            phone: data.phone ? String(data.phone).trim() : null,
            email: data.email ? String(data.email).trim().toLowerCase() : null,
            bankName: data.bankName.trim(),
            accountHolderName: data.accountHolderName.trim(),
            accountNumber: data.accountNumber.trim(),
            ifscCode: data.ifscCode.trim().toUpperCase(),
            branch: data.branch ? String(data.branch).trim() : null,
        };
    }

    
    validateSubmitPaymentProof(data = {}) {
        if (!data.paymentMethod || typeof data.paymentMethod !== 'string' || !data.paymentMethod.trim()) {
            throw new Error('paymentMethod is required');
        }

        if (!data.paymentDate) {
            throw new Error('paymentDate is required');
        }
        const paymentDate = new Date(data.paymentDate);
        if (isNaN(paymentDate.getTime())) {
            throw new Error('paymentDate must be a valid date');
        }

        const amountPaid = Number(data.amountPaid);
        if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
            throw new Error('amountPaid must be a positive number');
        }

        if (!data.transactionReference || typeof data.transactionReference !== 'string' || !data.transactionReference.trim()) {
            throw new Error('transactionReference is required');
        }

        return {
            paymentMethod: data.paymentMethod.trim(),
            paymentDate,
            amountPaid,
            transactionReference: data.transactionReference.trim(),
        };
        
    }

     validateVerifyPaymentProof(data = {}) {
        return {
            notes: data.notes ? String(data.notes).trim() : null,
        };
    }

}

module.exports = new QuotationValidator();