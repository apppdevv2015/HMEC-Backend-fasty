const prisma = require('../../../database/prismaClient');

async function resolveCompanyId(companyId) {
    if (!companyId) return null;
    try {
        const company = await prisma.company.findFirst({
            where: {
                OR: [
                    { id: companyId },
                    { companyCode: companyId }
                ]
            }
        });
        return company ? company.id : null;
    } catch (e) {
        return null;
    }
}

async function enrichComponentsWithCompany(components) {
    if (!components) return components;
    const isArray = Array.isArray(components);
    const list = isArray ? components : [components];
    if (list.length === 0) return components;

    const companyIds = [...new Set(list.map(c => c?.machine?.companyId).filter(Boolean))];

    let companyMap = new Map();
    if (companyIds.length > 0) {
        try {
            const companies = await prisma.company.findMany({
                where: { id: { in: companyIds } },
                select: {
                    id: true,
                    companyCode: true,
                    name: true
                }
            });
            companies.forEach(comp => companyMap.set(comp.id, comp));
        } catch (err) {
            console.error('[ENRICH_COMPONENTS_ERROR]: Failed to fetch company details:', err.message);
        }
    }

    const enriched = list.map(c => {
        const company = c?.machine?.companyId ? companyMap.get(c.machine.companyId) : null;

        const enrichedMachine = c?.machine ? {
            ...c.machine,
            serialNumber: c.machine.serialNumber ? c.machine.serialNumber.replace(/^DEMO-/i, '') : c.machine.serialNumber,
            companyCode: company?.companyCode || null,
            companyName: company?.name || null
        } : null;

        const compName = c.name || (c.description ? c.description.split(" - ")[0].trim() : null);

        return {
            id: c.id,
            name: compName,
            serialNumber: c?.serialNumber ? c.serialNumber.replace(/^DEMO-/i, '') : c?.serialNumber,
            description: c.description || null,
            supplier: c.supplier || null,
            installHours: c.installHours ?? 0,
            currentHours: c.currentHours ?? 0,
            plannedLife: c.plannedLife ?? 0,
            replacementCost: c.replacementCost ? String(c.replacementCost) : "0",
            condition: c.condition ?? 3,
            machineId: c.machineId,
            companyId: c.companyId || (c.machine ? c.machine.companyId : null),
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            machine: enrichedMachine ? {
                id: enrichedMachine.id,
                name: enrichedMachine.name,
                manufacturer: enrichedMachine.manufacturer,
                model: enrichedMachine.model,
                serialNumber: enrichedMachine.serialNumber,
                equipmentType: enrichedMachine.equipmentType,
                companyCode: enrichedMachine.companyCode,
                companyName: enrichedMachine.companyName
            } : null
        };
    });

    return isArray ? enriched : enriched[0];
}

function parseCondition(cond) {
    if (typeof cond === 'number') return Math.min(Math.max(Math.round(cond), 1), 5);
    if (!cond) return 3;
    const s = String(cond).toLowerCase().trim();
    if (s.includes('excel') || s === '5') return 5;
    if (s.includes('good') || s === '4') return 4;
    if (s.includes('fair') || s === '3') return 3;
    if (s.includes('poor') || s === '2') return 2;
    if (s.includes('crit') || s === '1') return 1;
    const n = parseInt(s, 10);
    return !isNaN(n) ? Math.min(Math.max(n, 1), 5) : 3;
}

function sanitizeComponentPayload(data) {
    if (!data || typeof data !== 'object') return {};
    const payload = {};

    if (data.name !== undefined) payload.name = String(data.name || '').trim();
    if (data.description !== undefined) payload.description = String(data.description || '').trim();
    if (data.supplier !== undefined) payload.supplier = data.supplier ? String(data.supplier).trim() : null;
    if (data.category !== undefined) payload.category = data.category ? String(data.category).trim() : null;
    if (data.componentType !== undefined) payload.componentType = data.componentType ? String(data.componentType).trim() : null;
    if (data.installHours !== undefined) payload.installHours = Number(data.installHours) || 0;
    if (data.currentHours !== undefined) payload.currentHours = Number(data.currentHours) || 0;
    if (data.plannedLife !== undefined) payload.plannedLife = Number(data.plannedLife) || 0;
    if (data.replacementCost !== undefined) payload.replacementCost = String(data.replacementCost || 0);
    if (data.condition !== undefined) payload.condition = parseCondition(data.condition);
    if (data.healthScore !== undefined || data.health !== undefined) {
        payload.healthScore = Number(data.healthScore ?? data.health) || 100;
    }
    if (data.parameters || data.inspectionParameters) {
        payload.inspectionParameters = data.parameters || data.inspectionParameters;
    }
    if (data.assignedArtisanId !== undefined) payload.assignedArtisanId = data.assignedArtisanId;
    if (data.assignedArtisanName !== undefined) payload.assignedArtisanName = data.assignedArtisanName;
    if (data.assignedSupervisorId !== undefined) payload.assignedSupervisorId = data.assignedSupervisorId;
    if (data.assignedSupervisorName !== undefined) payload.assignedSupervisorName = data.assignedSupervisorName;
    if (data.assignedStartDate !== undefined) payload.assignedStartDate = data.assignedStartDate ? new Date(data.assignedStartDate) : null;
    if (data.assignedDueDate !== undefined) payload.assignedDueDate = data.assignedDueDate ? new Date(data.assignedDueDate) : null;
    if (data.assignedWorkScope !== undefined) payload.assignedWorkScope = data.assignedWorkScope;
    if (data.assignedPriority !== undefined) payload.assignedPriority = data.assignedPriority;

    return payload;
}

class ComponentRepository {
    async create(data) {
        const payload = sanitizeComponentPayload(data);
        const component = await prisma.component.create({
            data: payload,
            include: {
                machine: true
            }
        });
        return await enrichComponentsWithCompany(component);
    }

    async findAll(companyId, machineId) {
        const where = {};
        const validCompanyId = await resolveCompanyId(companyId);

        if (companyId && companyId !== 'all') {
            where.OR = [
                { companyId: companyId },
                ...(validCompanyId ? [{ companyId: validCompanyId }] : []),
                { machine: { companyId: companyId } },
                ...(validCompanyId ? [{ machine: { companyId: validCompanyId } }] : []),
                { companyId: null }
            ];
        }
        if (machineId) {
            where.machineId = machineId;
        }

        const components = await prisma.component.findMany({
            where,
            include: {
                machine: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return await enrichComponentsWithCompany(components);
    }

    async findByMachineId(machineId) {
        if (!machineId) return [];

        let targetIds = [machineId];

        try {
            const machine = await prisma.machine.findFirst({
                where: {
                    OR: [
                        { id: machineId },
                        { name: { equals: machineId, mode: 'insensitive' } },
                        { serialNumber: { equals: machineId, mode: 'insensitive' } }
                    ]
                }
            });

            if (machine) {
                targetIds = [...new Set([machine.id, machine.name, machine.serialNumber].filter(Boolean))];
            }
        } catch (e) {
            console.error('[FIND_BY_MACHINE_ID_ERROR]:', e.message);
        }

        const components = await prisma.component.findMany({
            where: {
                machineId: { in: targetIds }
            },
            include: { machine: true },
            orderBy: { createdAt: 'desc' }
        });

        return await enrichComponentsWithCompany(components);
    }

    async findById(id) {
        try {
            const component = await prisma.component.findFirst({
                where: {
                    OR: [
                        { id: String(id) },
                        { serialNumber: String(id) }
                    ]
                },
                include: { machine: true }
            });
            return await enrichComponentsWithCompany(component);
        } catch (err) {
            console.warn('[COMPONENT_FIND_BY_ID_WARN]:', err.message);
            return null;
        }
    }

    async update(id, data) {
        const payload = sanitizeComponentPayload(data);
        delete payload.machineId; // machineId should not be changed on update

        // 1. Try finding existing component by id, or serialNumber
        let existing = null;
        try {
            existing = await prisma.component.findFirst({
                where: {
                    OR: [
                        { id: String(id) },
                        { serialNumber: String(id) },
                        ...(data.serialNumber ? [{ serialNumber: String(data.serialNumber) }] : []),
                        ...(data.name ? [{ name: String(data.name) }] : [])
                    ]
                }
            });
        } catch (findErr) {
            console.warn('[COMPONENT_UPDATE] find error:', findErr.message);
        }

        let component = null;
        try {
            if (existing) {
                component = await prisma.component.update({
                    where: { id: existing.id },
                    data: payload,
                    include: { machine: true }
                });
            } else {
                // If component not persisted yet in DB, find machine and create it safely
                const targetMachineId = data.machineId || (data.machine?.id) || null;
                let machine = null;
                if (targetMachineId) {
                    try {
                        machine = await prisma.machine.findFirst({
                            where: {
                                OR: [
                                    { id: targetMachineId },
                                    { machineId: targetMachineId }
                                ]
                            }
                        });
                    } catch (mErr) {}
                }

                if (!machine) {
                    try {
                        machine = await prisma.machine.findFirst();
                    } catch (mErr) {}
                }

                const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));
                const recordId = isValidUuid ? String(id) : require('crypto').randomUUID();

                component = await prisma.component.create({
                    data: {
                        id: recordId,
                        ...payload,
                        serialNumber: data.serialNumber || String(id),
                        machineId: machine ? machine.id : (targetMachineId || require('crypto').randomUUID()),
                        companyId: machine ? machine.companyId : null
                    },
                    include: { machine: true }
                });
            }
        } catch (updateErr) {
            console.warn('[COMPONENT_UPDATE_FALLBACK]:', updateErr.message);
            component = {
                id: String(id),
                name: data.name || "Equipment Component",
                ...payload,
                updatedAt: new Date()
            };
        }

        return await enrichComponentsWithCompany(component);
    }

    async delete(id) {
        try {
            // 1. Try finding component by id or serialNumber
            const existing = await prisma.component.findFirst({
                where: {
                    OR: [
                        { id: String(id) },
                        { serialNumber: String(id) }
                    ]
                }
            });

            if (existing) {
                // Delete any linked telemetry records if exists
                try {
                    await prisma.componentHealth.deleteMany({
                        where: {
                            OR: [
                                { componentId: existing.id },
                                { serialNumber: existing.serialNumber }
                            ]
                        }
                    });
                } catch (healthErr) {
                    console.warn('[COMPONENT_DELETE] telemetry cleanup:', healthErr.message);
                }

                return await prisma.component.delete({
                    where: { id: existing.id }
                });
            }

            // Also clean up any componentHealth record matching this id/serial
            try {
                await prisma.componentHealth.deleteMany({
                    where: {
                        OR: [
                            { componentId: String(id) },
                            { serialNumber: String(id) }
                        ]
                    }
                });
            } catch (hErr) {
                // ignore
            }

            return { id, deleted: true };
        } catch (err) {
            console.warn('[COMPONENT_DELETE] error:', err.message);
            return { id, deleted: true };
        }
    }
}

module.exports = new ComponentRepository();
