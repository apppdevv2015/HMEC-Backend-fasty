const quotationRepository = require('../repositories/quotation.repository');
const quotationInquiryRepository = require('../repositories/quotationInquiry.repository');
const optionalServiceRepository = require('../../optional-services/repositories/optionalService.repository');

class QuotationService {
    async generateInquiryId() {
        const count = await quotationInquiryRepository.count();
        const seq = String(count + 1).padStart(5, '0');
        return `QIN-${seq}`;
    }

    async createInquiry(data, user) {
        const companyId = data.companyId || user?.companyId || 'PROSPECTIVE';
        const companyName = data.companyName || user?.companyName || 'Prospective Client';
        const email = data.email || user?.email;

        if (!email) {
            throw new Error('Contact email is required to submit a quotation request');
        }
        if (!data.quotationType) {
            throw new Error('Quotation Type is required');
        }

        const inquiryId = await this.generateInquiryId();

        return quotationInquiryRepository.create({
            inquiryId,
            companyId,
            companyName,
            contactPerson: data.contactPerson || user?.firstName ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() : null,
            email,
            phone: data.phone || user?.mobileNumber || null,
            siteLocation: data.siteLocation || null,
            quotationType: data.quotationType,
            numberOfSites: Number(data.numberOfSites) || 1,
            siteNames: Array.isArray(data.siteNames) ? data.siteNames : (data.siteNames ? [data.siteNames] : []),
            activeMachines: Number(data.activeMachines) || 1,
            equipmentTypes: Array.isArray(data.equipmentTypes) ? data.equipmentTypes : (data.equipmentTypes ? [data.equipmentTypes] : []),
            contractDuration: data.contractDuration || '12 Months',
            implementationRequirements: data.implementationRequirements || null,
            additionalRequirements: data.additionalRequirements || null,
            attachmentUrl: data.attachmentUrl || null,
            attachmentFileName: data.attachmentFileName || null,
            attachmentFileType: data.attachmentFileType || null,
            attachmentSize: data.attachmentSize || null,
            status: 'ACTIVE',
            quotationStatus: null
        });
    }

    async getInquiries(user, query = {}) {
        const filter = { ...query };
        if (user && user.role !== 'super_admin' && user.companyId) {
            filter.companyId = user.companyId;
        }
        return quotationInquiryRepository.findAll(filter);
    }

    async getInquiryById(id, user) {
        const inq = await quotationInquiryRepository.findById(id);
        if (!inq) throw new Error('Quotation inquiry not found');
        if (user && user.role !== 'super_admin' && inq.companyId !== user.companyId) {
            throw new Error('Unauthorized to view this inquiry');
        }
        return inq;
    }

    async updateInquiry(id, data, user) {
        const inq = await this.getInquiryById(id, user);
        return quotationInquiryRepository.update(inq.id, data);
    }

    async deleteInquiry(id, user) {
        const inq = await this.getInquiryById(id, user);
        return quotationInquiryRepository.delete(inq.id);
    }

    async generateQuotationNumber() {
        const year = new Date().getFullYear();
        const count = await quotationRepository.count();
        const seq = String(count + 1).padStart(4, '0');
        return `QT-${year}-${seq}`;
    }

    async getQuotations(user, query = {}) {
        const filter = { ...query };
        
        // Super Admin sees all quotations; all other company roles see only their own company quotations
        if (user.role !== 'super_admin' && user.companyId) {
            filter.companyId = user.companyId;
        }

        return quotationRepository.findAll(filter);
    }

    async getQuotationById(id, user) {
        const quote = await quotationRepository.findById(id);
        if (!quote) throw new Error('Quotation not found');

        // Non-super-admin users can only view their own company's quotation
        if (user && user.role !== 'super_admin' && quote.companyId !== user.companyId) {
            throw new Error('Unauthorized to view this quotation');
        }

        return quote;
    }

    async requestQuotation(data, user) {
        if (!data.companyId && user?.companyId) {
            data.companyId = user.companyId;
        }
        if (!data.companyId) {
            throw new Error('Company ID is required');
        }
        if (!data.companyName) {
            throw new Error('Company Name is required');
        }

        const quotationNumber = await this.generateQuotationNumber();

        // Calculate estimated optional services cost if IDs passed
        let resolvedOptionalServices = [];
        let optionalAmount = 0;

        if (Array.isArray(data.optionalServices) && data.optionalServices.length > 0) {
            for (const item of data.optionalServices) {
                if (typeof item === 'string') {
                    const catalog = await optionalServiceRepository.findById(item);
                    if (catalog) {
                        const price = Number(catalog.defaultPrice) || 0;
                        optionalAmount += price;
                        resolvedOptionalServices.push({
                            id: catalog.id,
                            code: catalog.code,
                            name: catalog.name,
                            category: catalog.category,
                            price,
                            pricingType: catalog.pricingType
                        });
                    }
                } else if (typeof item === 'object') {
                    const price = Number(item.price ?? item.defaultPrice ?? 0);
                    optionalAmount += price;
                    resolvedOptionalServices.push(item);
                }
            }
        }

        const machineCount = Number(data.machineCount) || 1;
        const baseAmount = Number(data.baseAmount) || (machineCount * 1500);
        const discountAmount = Number(data.discountAmount) || 0;
        const totalAmount = Math.max(0, baseAmount + optionalAmount - discountAmount);

        return quotationRepository.create({
            quotationNumber,
            companyId: data.companyId,
            companyName: data.companyName,
            contactPerson: data.contactPerson || user?.name || null,
            contactEmail: data.contactEmail || user?.email || '',
            contactPhone: data.contactPhone || null,
            status: 'PENDING_REVIEW',
            tier: data.tier || 'Enterprise',
            machineCount,
            contractDuration: String(data.contractDuration || '12'),
            billingFrequency: data.billingFrequency || 'Monthly in Advance',
            baseAmount,
            optionalServicesAmount: optionalAmount,
            discountAmount,
            totalAmount,
            optionalServices: resolvedOptionalServices,
            notes: data.notes || 'Inquiry submitted via Platform portal.'
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

        const machineCount = Number(data.machineCount) || 1;
        const baseAmount = Number(data.baseAmount) || 0;
        const optionalServicesAmount = Number(data.optionalServicesAmount) || 0;
        const discountAmount = Number(data.discountAmount) || 0;
        const totalAmount = Number(data.totalAmount) || Math.max(0, baseAmount + optionalServicesAmount - discountAmount);

        return quotationRepository.create({
            quotationNumber,
            companyId: data.companyId,
            companyName: data.companyName,
            contactPerson: data.contactPerson,
            contactEmail: data.contactEmail,
            contactPhone: data.contactPhone,
            status: 'SENT',
            tier: data.tier || 'Enterprise',
            machineCount,
            contractDuration: String(data.contractDuration || '12'),
            billingFrequency: data.billingFrequency || 'Monthly in Advance',
            baseAmount,
            optionalServicesAmount,
            discountAmount,
            totalAmount,
            optionalServices: data.optionalServices || [],
            paymentTerms: data.paymentTerms || 'Net 30 Days',
            notes: data.notes || 'Official formal quotation from HME Platform.',
            sentAt: new Date(),
            validUntil: data.validUntil ? new Date(data.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
    }

    async acceptQuotation(id, data, user) {
        const quote = await this.getQuotationById(id, user);

        return quotationRepository.update(quote.id, {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
            signedBy: data.signedBy || user.name || user.email,
            signatureUrl: data.signatureUrl || data.signature || null
        });
    }

    async rejectQuotation(id, data, user) {
        const quote = await this.getQuotationById(id, user);

        return quotationRepository.update(quote.id, {
            status: 'REJECTED',
            rejectedAt: new Date(),
            notes: data.reason ? `${quote.notes ? quote.notes + ' | ' : ''}Rejection Reason: ${data.reason}` : quote.notes
        });
    }
}

module.exports = new QuotationService();
