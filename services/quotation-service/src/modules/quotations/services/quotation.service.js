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

    async acceptQuotation(id, data, user) {
        const quote = await this.getQuotationById(id, user);

        return quotationRepository.update(quote.id, {
            status:data.status,
            acceptedAt: new Date(),
            signedBy: data.signedBy || user.name || user.email,
            signatureUrl: data.signatureUrl || data.signature || null
        });
    }

    async rejectQuotation(id, data, user) {
        const quote = await this.getQuotationById(id, user);

        return quotationRepository.update(quote.id, {
            status:data.status,
            rejectedAt: new Date(),
            notes: data.reason ? `${quote.notes ? quote.notes + ' | ' : ''}Rejection Reason: ${data.reason}` : quote.notes
        });
    }
}

module.exports = new QuotationService();
