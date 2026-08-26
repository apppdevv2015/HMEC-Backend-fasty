const prisma = require('../../../config/database');

class QuotationRepository {
    async findAll(filter = {}) {
        const where = {};

        if (filter.companyId) {
            where.companyId = filter.companyId;
        }

        if (filter.status) {
            where.status = filter.status;
        }

        if (filter.search) {
            where.OR = [
                { quotationNumber: { contains: filter.search, mode: 'insensitive' } },
                { companyName: { contains: filter.search, mode: 'insensitive' } },
                { contactEmail: { contains: filter.search, mode: 'insensitive' } }
            ];
        }

        return prisma.quotation.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
    }

    async findById(id) {
        return prisma.quotation.findFirst({
            where: {
                OR: [
                    { id },
                    { quotationNumber: id }
                ]
            }
        });
    }

    async create(data) {
        return prisma.quotation.create({
            data: {
                quotationNumber: data.quotationNumber,
                companyId: data.companyId,
                companyName: data.companyName,
                contactPerson: data.contactPerson || null,
                contactEmail: data.contactEmail,
                contactPhone: data.contactPhone || null,
                status: data.status,
                tier: data.tier || 'Enterprise',
                machineCount: Number(data.machineCount) || 1,
                contractDuration: String(data.contractDuration || '12'),
                billingFrequency: data.billingFrequency || 'Monthly in Advance',
                baseAmount: Number(data.baseAmount) || 0,
                optionalServicesAmount: Number(data.optionalServicesAmount) || 0,
                discountAmount: Number(data.discountAmount) || 0,
                taxAmount: Number(data.taxAmount) || 0,
                totalAmount: Number(data.totalAmount) || 0,
                optionalServices: data.optionalServices || [],
                scopeOfWork: data.scopeOfWork || null,
                paymentTerms: data.paymentTerms || null,
                notes: data.notes || null,
                validUntil: data.validUntil ? new Date(data.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                sentAt: data.sentAt ? new Date(data.sentAt) : null
            }
        });
    }

    async update(id, data) {
        return prisma.quotation.update({
            where: { id },
            data
        });
    }

    async delete(id) {
        return prisma.quotation.delete({
            where: { id }
        });
    }

    async count(filter = {}) {
        return prisma.quotation.count({ where: filter });
    }
}

module.exports = new QuotationRepository();
