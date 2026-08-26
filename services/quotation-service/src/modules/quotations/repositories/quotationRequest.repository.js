const prisma = require('../../../config/database');

class QuotationRequestRepository {
    async count(where = {}) {
        return prisma.quotationRequest.count({ where });
    }

    async findAll(filter = {}) {
        const where = {};

        if (filter.companyId) {
            where.companyId = filter.companyId;
        }

        if (filter.userId) {
            where.userId = filter.userId;
        }

        if (filter.status) {
            where.status = filter.status;
        }

        if (filter.quotationType) {
            where.quotationType = filter.quotationType;
        }

        if (filter.search) {
            where.OR = [
                { requestId: { contains: filter.search, mode: 'insensitive' } },
                { companyName: { contains: filter.search, mode: 'insensitive' } },
                { contactPerson: { contains: filter.search, mode: 'insensitive' } },
                { email: { contains: filter.search, mode: 'insensitive' } }
            ];
        }

        return prisma.quotationRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
    }

    async findById(id) {
        return prisma.quotationRequest.findFirst({
            where: {
                OR: [
                    { id },
                    { requestId: id }
                ]
            }
        });
    }

    async create(data) {
        return prisma.quotationRequest.create({
            data: {
                requestId: data.requestId,
                userId: data.userId || null,
                companyId: data.companyId || null,
                companyName: data.companyName || null,
                contactPerson: data.contactPerson || null,
                email: data.email || null,
                phone: data.phone || null,
                siteLocation: data.siteLocation || null,
                quotationType: data.quotationType,
                numberOfSites: data.numberOfSites !== undefined ? Number(data.numberOfSites) : null,
                siteNames: data.siteNames || [],
                activeMachines: data.activeMachines !== undefined ? Number(data.activeMachines) : null,
                equipmentTypes: data.equipmentTypes || [],
                contractDuration: data.contractDuration || null,
                optionalServices: data.optionalServices || [],
                implementationRequirements: data.implementationRequirements || null,
                additionalRequirements: data.additionalRequirements || null,
                attachmentUrl: data.attachmentUrl || null,
                attachmentFileName: data.attachmentFileName || null,
                attachmentFileType: data.attachmentFileType || null,
                attachmentSize: data.attachmentSize ? Number(data.attachmentSize) : null,
                status: data.status || 'PENDING'
            }
        });
    }

    async update(id, data) {
        return prisma.quotationRequest.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            }
        });
    }

    async delete(id) {
        return prisma.quotationRequest.delete({
            where: { id }
        });
    }
}

module.exports = new QuotationRequestRepository();
