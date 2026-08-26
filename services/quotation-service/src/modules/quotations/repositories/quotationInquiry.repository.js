const prisma = require('../../../config/database');

class QuotationInquiryRepository {
    async count(where = {}) {
        return prisma.quotationInquiry.count({ where });
    }

    async findAll(filter = {}) {
        const where = {};

        if (filter.companyId) {
            where.companyId = filter.companyId;
        }

        if (filter.status) {
            where.status = filter.status;
        }

        if (filter.quotationType) {
            where.quotationType = filter.quotationType;
        }

        if (filter.search) {
            where.OR = [
                { inquiryId: { contains: filter.search, mode: 'insensitive' } },
                { companyName: { contains: filter.search, mode: 'insensitive' } },
                { contactPerson: { contains: filter.search, mode: 'insensitive' } },
                { email: { contains: filter.search, mode: 'insensitive' } }
            ];
        }

        return prisma.quotationInquiry.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
    }

    async findById(id) {
        return prisma.quotationInquiry.findFirst({
            where: {
                OR: [
                    { id },
                    { inquiryId: id }
                ]
            }
        });
    }

    async create(data) {
        return prisma.quotationInquiry.create({
            data: {
                inquiryId: data.inquiryId,
                companyId: data.companyId,
                companyName: data.companyName,
                contactPerson: data.contactPerson || null,
                email: data.email,
                phone: data.phone || null,
                siteLocation: data.siteLocation || null,
                quotationType: data.quotationType,
                numberOfSites: Number(data.numberOfSites) || 1,
                siteNames: data.siteNames || [],
                activeMachines: Number(data.activeMachines) || 1,
                equipmentTypes: data.equipmentTypes || [],
                contractDuration: data.contractDuration || '12 Months',
                implementationRequirements: data.implementationRequirements || null,
                additionalRequirements: data.additionalRequirements || null,
                attachmentUrl: data.attachmentUrl || null,
                attachmentFileName: data.attachmentFileName || null,
                attachmentFileType: data.attachmentFileType || null,
                attachmentSize: data.attachmentSize ? Number(data.attachmentSize) : null,
                status: data.status || 'ACTIVE',
                quotationStatus: data.quotationStatus || null
            }
        });
    }

    async update(id, data) {
        return prisma.quotationInquiry.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            }
        });
    }

    async delete(id) {
        return prisma.quotationInquiry.delete({
            where: { id }
        });
    }
}

module.exports = new QuotationInquiryRepository();
