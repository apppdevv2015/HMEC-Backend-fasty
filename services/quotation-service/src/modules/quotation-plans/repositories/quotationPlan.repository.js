const prisma = require('../../../config/database');

const DEFAULT_QUOTATION_PLANS = [
    {
        name: "Free Trial (14 Days)",
        tierCode: "TRIAL",
        minMachines: 1,
        maxMachines: 2,
        monthlyPrice: 0,
        currency: "ZAR",
        durationOptions: [1],
        isTrial: true,
        trialDays: 14,
        isCustom: false,
        features: [
            "Up to 2 Active Machines",
            "14-Day Free Evaluation Access",
            "Core Anomaly Detection Telemetry",
            "Full Platform Features Preview"
        ],
        sortOrder: 1,
        isActive: true
    },
    {
        name: "Up to 10 Machines",
        tierCode: "TIER_1",
        minMachines: 1,
        maxMachines: 10,
        monthlyPrice: 25000,
        currency: "ZAR",
        durationOptions: [1, 3, 6, 12, 24],
        isTrial: false,
        isCustom: false,
        features: [
            "Up to 10 Active Mining Machines",
            "Full CAN-bus Sensor Integration",
            "Vibration & Thermal Anomaly Detection",
            "Standard Operator & Artisan Dashboard",
            "Email & Helpdesk Support (SLA: 24h)"
        ],
        sortOrder: 2,
        isActive: true
    },
    {
        name: "11 – 25 Machines",
        tierCode: "TIER_2",
        minMachines: 11,
        maxMachines: 25,
        monthlyPrice: 45000,
        currency: "ZAR",
        durationOptions: [1, 3, 6, 12, 24],
        isTrial: false,
        isCustom: false,
        features: [
            "11 to 25 Active Mining Machines",
            "Real-time Fleet Health Heatmap",
            "Automated Digital Inspection Workflows",
            "Multi-component Risk Scoring",
            "Priority Support (SLA: 8h)"
        ],
        sortOrder: 3,
        isActive: true
    },
    {
        name: "26 – 75 Machines",
        tierCode: "TIER_3",
        minMachines: 26,
        maxMachines: 75,
        monthlyPrice: 95000,
        currency: "ZAR",
        durationOptions: [3, 6, 12, 24],
        isTrial: false,
        isCustom: false,
        features: [
            "26 to 75 Active Heavy Machines",
            "Advanced MTBF & Failure Prediction Engine",
            "Automated Work Order & Job Card Dispatch",
            "Unlimited Artisan & Supervisor Seats",
            "Dedicated Reliability Engineer Support"
        ],
        sortOrder: 4,
        isActive: true
    },
    {
        name: "76 – 150 Machines",
        tierCode: "TIER_4",
        minMachines: 76,
        maxMachines: 150,
        monthlyPrice: 150000,
        currency: "ZAR",
        durationOptions: [6, 12, 24, 36],
        isTrial: false,
        isCustom: false,
        features: [
            "76 to 150 Active Fleet Assets",
            "Full Site-wide Telemetry Gateway",
            "Executive C-Level PowerBI & Tableau Feeds",
            "Quarterly On-site Reliability Audit",
            "24/7 Priority Emergency Support SLA"
        ],
        sortOrder: 5,
        isActive: true
    },
    {
        name: "151+ Machines or Multiple Sites",
        tierCode: "CUSTOM",
        minMachines: 151,
        maxMachines: 9999,
        monthlyPrice: 0,
        currency: "ZAR",
        durationOptions: [12, 24, 36, 48],
        isTrial: false,
        isCustom: true,
        features: [
            "151+ Machines / Multi-Site Operations",
            "Tailored Custom SLA & On-premise Deployments",
            "Dedicated Cloud Instance & Custom ERP Connectors",
            "Full Custom Volume Pricing"
        ],
        sortOrder: 6,
        isActive: true
    }
];

function formatPlan(plan) {
    if (!plan) return null;
    const rawOptions = Array.isArray(plan.durationOptions) ? plan.durationOptions : [1, 3, 6, 12, 24];
    const durationMonths = rawOptions.map(m => Number(m)).filter(m => !isNaN(m) && m > 0);
    
    const durations = durationMonths.map(m => {
        let label = `${m} Month${m > 1 ? 's' : ''}`;
        let billing = 'Monthly';
        if (m === 3) billing = 'Quarterly';
        if (m === 6) billing = 'Semi-Annual';
        if (m === 12) billing = 'Annual (1 Year)';
        if (m === 24) billing = '2 Years';
        if (m === 36) billing = '3 Years';
        return {
            months: m,
            label,
            billing
        };
    });

    const durationLabels = durations.map(d => d.label);

    return {
        ...plan,
        durationMonths,
        durationLabels,
        durations
    };
}

class QuotationPlanRepository {
    async seedDefaultsIfEmpty() {
        try {
            const count = await prisma.quotationPlan.count();
            if (count === 0) {
                console.log('[QUOTATION_PLAN_REPO] Seeding 6 default ZAR quotation pricing plans...');
                for (const plan of DEFAULT_QUOTATION_PLANS) {
                    await prisma.quotationPlan.create({
                        data: {
                            ...plan,
                            monthlyPrice: plan.monthlyPrice
                        }
                    }).catch(e => console.log(`Plan seed skip: ${e.message}`));
                }
                console.log('[QUOTATION_PLAN_REPO] Seed completed successfully.');
            }
        } catch (e) {
            console.error('[QUOTATION_PLAN_SEED_ERR]:', e.message);
        }
    }

    async findAll({ isActive, search } = {}) {
        await this.seedDefaultsIfEmpty();
        const where = {};
        if (isActive !== undefined) {
            where.isActive = Boolean(isActive);
        }
        if (search && search.trim()) {
            const s = search.trim();
            where.OR = [
                { name: { contains: s, mode: 'insensitive' } },
                { tierCode: { contains: s, mode: 'insensitive' } }
            ];
        }

        const plans = await prisma.quotationPlan.findMany({
            where,
            orderBy: [
                { sortOrder: 'asc' },
                { monthlyPrice: 'asc' },
                { createdAt: 'asc' }
            ]
        });

        return plans.map(formatPlan);
    }

    async findById(id) {
        const plan = await prisma.quotationPlan.findUnique({
            where: { id }
        });
        return formatPlan(plan);
    }

    async findByName(name) {
        const plan = await prisma.quotationPlan.findFirst({
            where: {
                name: { equals: name.trim(), mode: 'insensitive' }
            }
        });
        return formatPlan(plan);
    }

    async create(data) {
        const rawDurations = data.durationOptions || data.durationMonths || data.months;
        const durationOptions = Array.isArray(rawDurations) 
            ? rawDurations.map(m => Number(m)).filter(m => !isNaN(m) && m > 0)
            : (rawDurations ? [Number(rawDurations)] : [1, 3, 6, 12, 24]);

        const created = await prisma.quotationPlan.create({
            data: {
                name: data.name.trim(),
                tierCode: data.tierCode || null,
                minMachines: Number(data.minMachines) || 1,
                maxMachines: Number(data.maxMachines) || 10,
                monthlyPrice: Number(data.monthlyPrice) || 0,
                currency: data.currency || 'ZAR',
                durationOptions,
                isTrial: Boolean(data.isTrial),
                trialDays: data.trialDays ? Number(data.trialDays) : 14,
                isCustom: Boolean(data.isCustom),
                features: Array.isArray(data.features) ? data.features : [],
                sortOrder: Number(data.sortOrder) || 0,
                isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
            }
        });

        return formatPlan(created);
    }

    async update(id, data) {
        const payload = {};
        if (data.name !== undefined) payload.name = data.name.trim();
        if (data.tierCode !== undefined) payload.tierCode = data.tierCode;
        if (data.minMachines !== undefined) payload.minMachines = Number(data.minMachines);
        if (data.maxMachines !== undefined) payload.maxMachines = Number(data.maxMachines);
        if (data.monthlyPrice !== undefined) payload.monthlyPrice = Number(data.monthlyPrice);
        if (data.currency !== undefined) payload.currency = data.currency;

        if (data.durationOptions !== undefined || data.durationMonths !== undefined || data.months !== undefined) {
            const rawDurations = data.durationOptions || data.durationMonths || data.months;
            payload.durationOptions = Array.isArray(rawDurations)
                ? rawDurations.map(m => Number(m)).filter(m => !isNaN(m) && m > 0)
                : [Number(rawDurations)];
        }

        if (data.isTrial !== undefined) payload.isTrial = Boolean(data.isTrial);
        if (data.trialDays !== undefined) payload.trialDays = Number(data.trialDays);
        if (data.isCustom !== undefined) payload.isCustom = Boolean(data.isCustom);
        if (data.features !== undefined) payload.features = data.features;
        if (data.sortOrder !== undefined) payload.sortOrder = Number(data.sortOrder);
        if (data.isActive !== undefined) payload.isActive = Boolean(data.isActive);

        const updated = await prisma.quotationPlan.update({
            where: { id },
            data: payload
        });

        return formatPlan(updated);
    }

    async toggleActive(id) {
        const current = await this.findById(id);
        if (!current) return null;

        const updated = await prisma.quotationPlan.update({
            where: { id },
            data: { isActive: !current.isActive }
        });

        return formatPlan(updated);
    }

    async delete(id) {
        return prisma.quotationPlan.delete({
            where: { id }
        });
    }
}

module.exports = new QuotationPlanRepository();
