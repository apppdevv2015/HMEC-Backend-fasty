const crypto = require('crypto');
const quotationRepository = require('../repositories/quotation.repository');
const quotationRequestRepository = require('../repositories/quotationRequest.repository');
const optionalServiceRepository = require('../../optional-services/repositories/optionalService.repository');

// Helper to determine if user has global super admin privileges
const isSuperAdmin = (user) => {
    if (!user) return false;
    if (user.isSuperAdmin === true) return true;
    const role = String(user.role || user.roleName || user.role_name || '').toLowerCase().replace(/[\s_-]+/g, '');
    return role === 'superadmin';
};

// Helper to generate unambiguous uppercase alphanumeric code
const generateAlphanumericCode = (length = 4) => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const bytes = crypto.randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[bytes[i] % chars.length];
    }
    return result;
};

// Helper to get current Date string in YYYYMMDD format
const getFormattedDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
};

const quotationRequestValidator = require('../validators/quotationRequest.validator');

class QuotationService {
    async generateRequestId() {
        const dateStr = getFormattedDate();
        const suffix = generateAlphanumericCode(4);
        return `REQ-${dateStr}-${suffix}`;
    }

    async createQuotationRequest(data, user) {
        // 1. Delegate validation to dedicated validator
        const validated = quotationRequestValidator.validateCreate(data);

        const companyId = user?.companyId || data.companyId || null;
        const companyName = validated.companyName || user?.companyName || null;
        const email = validated.email || user?.email || null;
        const contactPerson = validated.contactPerson || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null);
        const phone = validated.phone || user?.mobileNumber || null;

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
            status: data.status || 'PENDING'
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
        if (!req) throw new Error('Quotation request not found');
        if (user?.companyId && !isSuperAdmin(user) && req.companyId !== user.companyId) {
            throw new Error('Unauthorized to view this quotation request');
        }
        return req;
    }

    async updateQuotationRequest(id, data, user) {
        const req = await this.getQuotationRequestById(id, user);
        return quotationRequestRepository.update(req.id, data);
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
        if (!quote) throw new Error('Quotation not found');
        if (user?.companyId && !isSuperAdmin(user) && quote.companyId !== user.companyId) {
            throw new Error('Unauthorized to view this quotation');
        }
        return quote;
    }

    async requestQuotation(data, user) {
        const companyId = user?.companyId || data.companyId || null;
        const companyName = user?.companyName || data.companyName || null;
        const quotationNumber = await this.generateQuotationNumber();

        const machineCount = Number(data.machineCount) || 1;
        const baseAmount = Number(data.baseAmount) || 0;
        const optionalServicesAmount = Number(data.optionalServicesAmount) || 0;
        const discountAmount = Number(data.discountAmount) || 0;
        const totalAmount = Number(data.totalAmount) || Math.max(0, baseAmount + optionalServicesAmount - discountAmount);

        return quotationRepository.create({
            quotationNumber,
            companyId,
            companyName,
            contactPerson: data.contactPerson || user?.name || null,
            contactEmail: data.contactEmail || user?.email || null,
            contactPhone: data.contactPhone || null,
            status: 'PENDING_REVIEW',
            tier: data.tier || null,
            machineCount: data.machineCount !== undefined ? Number(data.machineCount) : null,
            contractDuration: data.contractDuration ? String(data.contractDuration) : null,
            billingFrequency: data.billingFrequency || null,
            baseAmount,
            optionalServicesAmount,
            discountAmount,
            totalAmount,
            optionalServices: data.optionalServices || [],
            notes: data.notes || null
        });
    }

    async sendQuotation(data, user) {
        if (!data.companyId || !data.companyName) {
            throw new Error('Company details are required to send a quotation');
        }

        let quotationNumber = data.quotationNumber;
        if (!quotationNumber) {
            quotationNumber = await this.generateQuotationNumber();
        }

        const machineCount = data.machineCount !== undefined ? Number(data.machineCount) : null;
        const baseAmount = Number(data.baseAmount) || 0;
        const optionalServicesAmount = Number(data.optionalServicesAmount) || 0;
        const discountAmount = Number(data.discountAmount) || 0;
        const totalAmount = Number(data.totalAmount) || Math.max(0, baseAmount + optionalServicesAmount - discountAmount);

        return quotationRepository.create({
            quotationNumber,
            companyId: data.companyId,
            companyName: data.companyName,
            contactPerson: data.contactPerson || null,
            contactEmail: data.contactEmail || null,
            contactPhone: data.contactPhone || null,
            status:data.status,
            tier: data.tier || null,
            machineCount,
            contractDuration: data.contractDuration ? String(data.contractDuration) : null,
            billingFrequency: data.billingFrequency || null,
            baseAmount,
            optionalServicesAmount,
            discountAmount,
            totalAmount,
            optionalServices: data.optionalServices || [],
            paymentTerms: data.paymentTerms || null,
            notes: data.notes || null,
            sentAt: new Date(),
            validUntil: data.validUntil ? new Date(data.validUntil) : null
        });
    }

    async createAddonQuotation(data, user) {
        const quotationNumber = await this.generateQuotationNumber();
        const companyId = data.companyId || user?.companyId || 'HME-COMP-' + generateAlphanumericCode(4);
        const companyName = data.companyName || user?.companyName || 'Valued Client';
        
        const machineCount = Number(data.machineCount) || Number(data.extraMachines) || 1;
        const ratePerMachine = Number(data.ratePerMachine) || 1500;
        const durationMonths = Number(data.contractDuration || data.durationMonths) || 12;
        const baseAmount = Number(data.baseAmount) || (machineCount * ratePerMachine * durationMonths);
        const optionalServicesAmount = Number(data.optionalServicesAmount) || 0;
        const discountAmount = Number(data.discountAmount) || 0;
        const taxRate = Number(data.taxRate) || 0.15; // 15% VAT
        const subtotal = Math.max(0, baseAmount + optionalServicesAmount - discountAmount);
        const taxAmount = Number(data.taxAmount) || Math.round(subtotal * taxRate * 100) / 100;
        const totalAmount = Number(data.totalAmount) || (subtotal + taxAmount);

        const paymentMethod = data.paymentMethod || 'EFT';
        const eftReferenceNumber = data.eftReferenceNumber || `EFT-${quotationNumber}`;

        const scopeOfWorkData = {
            quotationType: data.quotationType || 'MACHINE_ADDON',
            extraMachines: machineCount,
            machineTypes: data.machineTypes || [],
            extraSites: data.extraSites || 0,
            siteNames: data.siteNames || [],
            paymentMethod,
            eftReferenceNumber,
            proofOfPaymentUrl: data.proofOfPaymentUrl || null,
            bankDetails: {
                bankName: 'First National Bank (FNB)',
                accountName: 'HME Intelligence (Pty) Ltd',
                accountNumber: '62894109823',
                branchCode: '250655',
                accountType: 'Current / Cheque',
                referenceCode: eftReferenceNumber
            },
            createdBy: user?.name || user?.email || 'Super Admin',
            notes: data.notes || ''
        };

        return quotationRepository.create({
            quotationNumber,
            companyId,
            companyName,
            contactPerson: data.contactPerson || user?.name || null,
            contactEmail: data.contactEmail || user?.email || 'finance@client.com',
            contactPhone: data.contactPhone || null,
            status: data.status || (data.proofOfPaymentUrl ? 'EFT_SUBMITTED' : 'ISSUED'),
            tier: data.tier || 'Add-on Fleet Expansion',
            machineCount,
            contractDuration: String(durationMonths),
            billingFrequency: data.billingFrequency || 'Monthly in Advance',
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
            validUntil: data.validUntil ? new Date(data.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
    }

    async submitEftPayment(id, data, user) {
        const quote = await this.getQuotationById(id, user);

        const currentScope = quote.scopeOfWork && typeof quote.scopeOfWork === 'object' ? quote.scopeOfWork : {};
        const updatedScope = {
            ...currentScope,
            paymentMethod: 'EFT',
            eftReferenceNumber: data.eftReferenceNumber || currentScope.eftReferenceNumber || `EFT-${quote.quotationNumber}`,
            proofOfPaymentUrl: data.proofOfPaymentUrl || data.popUrl || currentScope.proofOfPaymentUrl,
            eftSubmittedAt: new Date().toISOString(),
            eftSubmittedBy: user?.name || user?.email || 'Client User',
            submissionNotes: data.notes || ''
        };

        return quotationRepository.update(quote.id, {
            status: 'EFT_SUBMITTED',
            scopeOfWork: updatedScope,
            notes: data.notes ? `${quote.notes ? quote.notes + ' | ' : ''}EFT Submitted: ${data.notes}` : quote.notes
        });
    }

    async verifyEftPayment(id, data, user) {
        const quote = await this.getQuotationById(id, user);
        const action = String(data.action || 'APPROVE').toUpperCase();

        const currentScope = quote.scopeOfWork && typeof quote.scopeOfWork === 'object' ? quote.scopeOfWork : {};
        const isApproved = action === 'APPROVE';

        const updatedScope = {
            ...currentScope,
            paymentVerifiedAt: new Date().toISOString(),
            paymentVerifiedBy: user?.name || user?.email || 'Super Admin',
            verificationStatus: isApproved ? 'APPROVED' : 'REJECTED',
            verificationNotes: data.notes || ''
        };

        return quotationRepository.update(quote.id, {
            status: isApproved ? 'PAID' : 'REJECTED',
            scopeOfWork: updatedScope,
            acceptedAt: isApproved ? new Date() : quote.acceptedAt,
            notes: `${quote.notes ? quote.notes + ' | ' : ''}EFT ${isApproved ? 'Approved & Paid' : 'Rejected'}: ${data.notes || 'By Admin'}`
        });
    }
}

module.exports = new QuotationService();
