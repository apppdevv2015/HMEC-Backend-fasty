const prisma = require('../config/database');

const DEFAULT_OPTIONAL_SERVICES = [
    {
        code: 'telematics',
        name: 'Telematics / ECU Integration',
        category: 'Integration',
        description: 'Direct CAN-bus, IoT telematics gateway, and OEM electronic control unit integration for real-time telemetry streaming.',
        pricingType: 'as_per_requirement',
        defaultPrice: 2500.00,
        unit: 'per machine setup',
        sortOrder: 1,
        features: [
            'Real-time CAN-bus engine parameter streaming',
            'Automated fault code (DTC) ingestion',
            'GPS geofencing & operational route mapping',
            'OEM multi-protocol support (CAT, Komatsu, Volvo)'
        ]
    },
    {
        code: 'erp',
        name: 'SAP / ERP Integration',
        category: 'Integration',
        description: 'Seamless bidirectional synchronization with corporate ERP, SAP S/4HANA, Microsoft Dynamics, and Oracle EAM.',
        pricingType: 'as_per_requirement',
        defaultPrice: 4500.00,
        unit: 'one-time enterprise connector',
        sortOrder: 2,
        features: [
            'Automated purchase order & spare parts requisition',
            'Work order sync with SAP Maintenance module',
            'Inventory level and component catalog matching',
            'Financial costing and maintenance budget tracking'
        ]
    },
    {
        code: 'reports',
        name: 'Custom Reports & Advanced Analytics',
        category: 'Analytics',
        description: 'Tailored executive dashboards, scheduled PDF digests, predictive MTBF analytics, and regulatory compliance reports.',
        pricingType: 'included',
        defaultPrice: 1200.00,
        unit: 'annual subscription',
        sortOrder: 3,
        features: [
            'Custom KPI calculations & fleet availability metrics',
            'Automated shift and weekly executive PDF email digest',
            'Predictive remaining useful life (RUL) modeling',
            'Regulatory safety & emissions compliance exports'
        ]
    },
    {
        code: 'migration',
        name: 'Historical Data Migration & Cleaning',
        category: 'Data',
        description: 'Complete extraction, cleaning, deduplication, and ingestion of legacy machine maintenance logs, paper records, and spreadsheet archives.',
        pricingType: 'as_per_requirement',
        defaultPrice: 3000.00,
        unit: 'one-time migration project',
        sortOrder: 4,
        features: [
            'Legacy Excel & CSV data parsing and normalization',
            'Historical component failure rate baseline setup',
            'Data validation and anomaly scrubbing',
            'Full database audit trail preservation'
        ]
    },
    {
        code: 'training',
        name: 'Additional Training & Certification',
        category: 'Training',
        description: 'On-site workshops and remote certification programs for operators, artisans, supervisors, and administrative personnel.',
        pricingType: 'as_per_requirement',
        defaultPrice: 1800.00,
        unit: 'per session (up to 20 users)',
        sortOrder: 5,
        features: [
            'Interactive operator digital pre-start training',
            'Artisan maintenance and repair logging workshop',
            'Supervisor fleet monitoring & task approval coaching',
            'Official HME Platform certification credentials'
        ]
    },
    {
        code: 'support',
        name: 'On-site Technical Support & Field Engineers',
        category: 'Support',
        description: 'Dedicated 24/7 technical support hotline, SLA-backed response times, and on-site senior field reliability engineers.',
        pricingType: 'as_per_requirement',
        defaultPrice: 5000.00,
        unit: 'monthly dedicated tier',
        sortOrder: 6,
        features: [
            '24/7 dedicated engineering hotline & WhatsApp dispatch',
            'Priority 1-hour critical incident SLA response',
            'Quarterly on-site health review by reliability master',
            'Custom firmware & telemetry sensor troubleshooting'
        ]
    }
];

async function seedDefaultOptionalServices() {
    try {
        console.log('🔄 [SEED_OPTIONAL_SERVICES]: Verifying default optional services catalog...');
        for (const service of DEFAULT_OPTIONAL_SERVICES) {
            await prisma.optionalServiceCatalog.upsert({
                where: { code: service.code },
                update: {
                    name: service.name,
                    category: service.category,
                    description: service.description,
                    pricingType: service.pricingType,
                    defaultPrice: service.defaultPrice,
                    unit: service.unit,
                    features: service.features,
                    sortOrder: service.sortOrder
                },
                create: {
                    code: service.code,
                    name: service.name,
                    category: service.category,
                    description: service.description,
                    pricingType: service.pricingType,
                    defaultPrice: service.defaultPrice,
                    unit: service.unit,
                    features: service.features,
                    sortOrder: service.sortOrder,
                    isActive: true
                }
            });
        }
        console.log('✅ [SEED_OPTIONAL_SERVICES]: Default optional services catalog is ready.');
    } catch (error) {
        console.error('⚠️ [SEED_OPTIONAL_SERVICES_ERROR]:', error.message);
    }
}

module.exports = seedDefaultOptionalServices;
