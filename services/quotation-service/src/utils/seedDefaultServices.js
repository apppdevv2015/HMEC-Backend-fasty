const prisma = require('../config/database');

const DEFAULT_OPTIONAL_SERVICES = [
    {
        name: 'Telematics / ECU Integration',
        description: 'Direct CAN-bus, IoT telematics gateway, and OEM electronic control unit integration for real-time telemetry streaming.',
        sortOrder: 1
    },
    {
        name: 'SAP / ERP Integration',
        description: 'Seamless bidirectional synchronization with corporate ERP, SAP S/4HANA, Microsoft Dynamics, and Oracle EAM.',
        sortOrder: 2
    },
    {
        name: 'Custom Reports & Advanced Analytics',
        description: 'Tailored executive dashboards, scheduled PDF digests, predictive MTBF analytics, and regulatory compliance reports.',
        sortOrder: 3
    },
    {
        name: 'Historical Maintenance Data Migration',
        description: 'Data cleansing, sanitization, and structured import of legacy work orders, inspection archives, and failure records.',
        sortOrder: 4
    },
    {
        name: 'On-Site Reliability Engineer Training',
        description: 'Comprehensive 3-day on-site or virtual certification workshop for mine maintenance engineers and asset planners.',
        sortOrder: 5
    },
    {
        name: '24/7 Dedicated Support Engineer SLA',
        description: 'Round-the-clock priority technical hotline, dedicated reliability account engineer, and guaranteed 1-hour critical incident response.',
        sortOrder: 6
    }
];

async function seedDefaultOptionalServices() {
    try {
        console.log('🔄 [SEED_OPTIONAL_SERVICES]: Verifying default optional services catalog...');
        for (const service of DEFAULT_OPTIONAL_SERVICES) {
            const existing = await prisma.optionalServiceCatalog.findFirst({
                where: { name: service.name }
            });

            if (existing) {
                await prisma.optionalServiceCatalog.update({
                    where: { id: existing.id },
                    data: {
                        description: service.description,
                        sortOrder: service.sortOrder
                    }
                });
            } else {
                await prisma.optionalServiceCatalog.create({
                    data: {
                        name: service.name,
                        description: service.description,
                        sortOrder: service.sortOrder,
                        isActive: false
                    }
                });
            }
        }
        console.log('✅ [SEED_OPTIONAL_SERVICES]: Default optional services catalog is ready.');
    } catch (error) {
        console.error('⚠️ [SEED_OPTIONAL_SERVICES_ERROR]:', error.message);
    }
}

module.exports = seedDefaultOptionalServices;
