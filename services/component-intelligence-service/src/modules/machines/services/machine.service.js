const machineRepository = require('../repositories/machine.repository');
const { createClient } = require('redis');
const prisma = require('../../../database/prismaClient');
const saveMachineImageFile = require('../../../utils/saveMachineImageFile');

async function publishRedisAlert(channel, payload) {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    const client = createClient({ 
        url: redisUrl,
        RESP: 2,
        socket: {
            connectTimeout: 2000,
            reconnectStrategy: false
        }
    });
    client.on('error', (err) => console.error('[Redis Error]', err.message || err));
    try {
        await client.connect();
        await client.publish(channel, JSON.stringify(payload));
        console.log(`[REDIS-PUB] Published alert to ${channel}`);
    } catch (error) {
        console.error('Failed to publish alert to Redis:', error);
    } finally {
        try {
            await client.disconnect();
        } catch (e) {}
    }
}

class MachineService {
    async addMachine(data) {
        // 1. Check active subscription
        const subscription = await machineRepository.getCompanyActiveSubscription(data.companyId);
        if (!subscription) {
            throw new Error("No active subscription found. Please subscribe to a plan to add machines.");
        }

        // 2. Check machine limits
        const machineLimit = subscription.plan.machineLimit;
        const currentMachinesCount = await machineRepository.countMachinesByCompany(data.companyId);

        if (currentMachinesCount >= machineLimit) {
            throw new Error(`Subscription limit reached. Your current plan allows a maximum of ${machineLimit} machines. Please upgrade your plan to add more.`);
        }

        // 3. Create machine if limits are valid
        const rawImg = data.imageUrl || data.image_url || data.image || data.photo || null;
        const savedImgUrl = saveMachineImageFile(rawImg);

        const dbData = {
            name: data.name,
            model: data.model,
            serialNumber: data.serialNumber,
            companyId: data.companyId,
            manufacturer: data.manufacturer || "Komatsu",
            imageUrl: savedImgUrl,
        };
        if (data.equipmentType) dbData.equipmentType = data.equipmentType;
        if (data.site || data.equipmentType) dbData.site = data.site || data.equipmentType;
        if (data.costPerHourTarget !== undefined && data.costPerHourTarget !== null) dbData.costPerHourTarget = data.costPerHourTarget;
        if (data.costPerTonTarget !== undefined && data.costPerTonTarget !== null) dbData.costPerTonTarget = data.costPerTonTarget;
        if (data.condition !== undefined && data.condition !== null) dbData.condition = Number(data.condition);
        if (data.status) dbData.status = data.status;
        const machine = await machineRepository.create(dbData);

        // --- Save Notification to Database ---
        let savedDbAlert;
        try {
            savedDbAlert = await prisma.notification.create({
                data: {
                    companyId: machine.companyId,
                    message: `🚚 [FLEET ALERT] New Machine "${machine.name}" (${machine.model}) has been successfully added to site "${machine.site || 'N/A'}".`,
                    type: 'fleet',
                    isRead: false
                }
            });
        } catch (dbErr) {
            console.error('[DB-NOTIFICATION-ERROR] Failed to save machine alert to database:', dbErr.message);
        }

        // --- Real-time WebSocket Alert ---
        const alertPayload = {
            id: savedDbAlert ? savedDbAlert.id : 'alert-' + Date.now(),
            severity: 'INFO',
            component: 'Fleet Manager',
            message: `🚚 [FLEET ALERT] New Machine "${machine.name}" (${machine.model}) has been successfully added to site "${machine.site || 'N/A'}".`,
            timestamp: new Date().toISOString()
        };
        publishRedisAlert('role:Admin:alerts', alertPayload);
        publishRedisAlert('alerts:global', alertPayload);

        return mapMachineResponse(machine);
    }

    async getMachines(companyId) {
        try {
            const machines = await machineRepository.findAll(companyId);
            if (!Array.isArray(machines)) return [];
            return machines.map(mapMachineResponse).filter(Boolean);
        } catch (e) {
            console.error('[SERVICE GET_MACHINES ERROR]:', e);
            return [];
        }
    }

    async getPaginatedMachines({ companyId, page, limit, search }) {
        const result = await machineRepository.findPaginated({ companyId, page, limit, search });
        return {
            ...result,
            data: result.data.map(mapMachineResponse)
        };
    }

    async getMachineById(id) {
        const machine = await machineRepository.findById(id);
        return mapMachineResponse(machine);
    }

    async updateMachine(id, data) {
        const dbData = {};
        if (data.name !== undefined) dbData.name = data.name;
        if (data.manufacturer !== undefined) dbData.manufacturer = data.manufacturer;
        if (data.model !== undefined) dbData.model = data.model;
        if (data.serialNumber !== undefined) dbData.serialNumber = data.serialNumber;
        if (data.imageUrl !== undefined || data.image_url !== undefined || data.image !== undefined) {
            const rawImg = data.imageUrl !== undefined ? data.imageUrl : (data.image_url !== undefined ? data.image_url : data.image);
            dbData.imageUrl = saveMachineImageFile(rawImg);
        }
        if (data.equipmentType !== undefined) {
            dbData.equipmentType = data.equipmentType;
            dbData.site = data.equipmentType;
        }
        if (data.site !== undefined) dbData.site = data.site;
        if (data.costPerHourTarget !== undefined) dbData.costPerHourTarget = data.costPerHourTarget;
        if (data.costPerTonTarget !== undefined) dbData.costPerTonTarget = data.costPerTonTarget;
        // Assignment fields
        if (data.assignedOperatorId !== undefined) dbData.assignedOperatorId = data.assignedOperatorId;
        if (data.assignedOperatorName !== undefined) dbData.assignedOperatorName = data.assignedOperatorName;
        if (data.assignedArtisanId !== undefined) dbData.assignedArtisanId = data.assignedArtisanId;
        if (data.assignedArtisanName !== undefined) dbData.assignedArtisanName = data.assignedArtisanName;
        if (data.assignedSupervisorId !== undefined) dbData.assignedSupervisorId = data.assignedSupervisorId;
        if (data.assignedSupervisorName !== undefined) dbData.assignedSupervisorName = data.assignedSupervisorName;
        if (data.condition !== undefined && data.condition !== null) dbData.condition = Number(data.condition);
        if (data.status !== undefined) dbData.status = data.status;
        
        const machine = await machineRepository.update(id, dbData);
        return mapMachineResponse(machine);
    }

    async assignMachine(id, data, user) {
        const assignedAt = data.assignedAt || new Date().toISOString();
        
        // 1. Automatically bind companyId from logged-in user context
        const companyId = user?.companyId || data.companyId;

        // 2. Multitenancy Check: Verify target Machine belongs to the user's company
        let targetMachine = await machineRepository.findById(id);
        if (!targetMachine) {
            try {
                targetMachine = await prisma.machine.findFirst({
                    where: {
                        OR: [
                            { serialNumber: id },
                            { name: id }
                        ]
                    }
                });

                if (!targetMachine) {
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
                    const orConditions = [{ slug: id }];
                    if (isUuid) orConditions.push({ id });

                    let catalogItem = await prisma.masterEquipmentCatalog.findFirst({
                        where: { OR: orConditions }
                    });

                    let targetCompanyId = companyId;
                    if (!targetCompanyId) {
                        const defaultComp = await prisma.company.findFirst();
                        if (defaultComp) targetCompanyId = defaultComp.id;
                    }

                    if (targetCompanyId) {
                        const uniqueSerial = data.serialNumber || `SN-${(catalogItem?.brand || 'CAT').toUpperCase().substring(0, 4)}-${Date.now().toString(36).toUpperCase().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`;
                        targetMachine = await prisma.machine.create({
                            data: {
                                id: isUuid ? id : undefined,
                                name: catalogItem ? `${catalogItem.brand} ${catalogItem.modelName}` : data.machineName || `Equipment ${id}`,
                                model: catalogItem ? catalogItem.modelName : data.model || `Model ${id}`,
                                manufacturer: catalogItem ? catalogItem.brand : data.brand || 'Caterpillar',
                                equipmentType: catalogItem ? catalogItem.category : data.category || 'General',
                                serialNumber: uniqueSerial,
                                companyId: targetCompanyId,
                                status: 'Healthy',
                                healthScore: 100
                            }
                        });
                    }
                }
            } catch (e) {
                console.warn('[MACHINE_ASSIGN_PROVISION_WARN]:', e.message);
            }
        }

        if (!targetMachine) {
            throw new Error("Machine not found.");
        }

        // 3. Automatically bind supervisor details from logged-in user context
        const supervisorId = user?.id || user?.userId || data.supervisorId || data.assignedSupervisorId;
        const supervisorName = (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '') || user?.name || user?.fullName || data.supervisorName || data.assignedSupervisorName || 'Supervisor';

        // Collect all user IDs passed in payload (userId can be string or array)
        let rawUserIds = [];
        if (typeof data.userId === 'string') rawUserIds.push(data.userId);
        if (Array.isArray(data.userId)) rawUserIds.push(...data.userId);
        if (Array.isArray(data.userIds)) rawUserIds.push(...data.userIds);
        if (data.operatorId) rawUserIds.push(data.operatorId);
        if (data.artisanId) rawUserIds.push(data.artisanId);

        const uniqueUserIds = [...new Set(rawUserIds)].filter(Boolean);

        // Preserve existing machine assignments so assigning an Operator does not erase Artisan, and vice-versa
        let operatorId = targetMachine.assignedOperatorId || null;
        let operatorName = targetMachine.assignedOperatorName || null;
        let artisanId = targetMachine.assignedArtisanId || null;
        let artisanName = targetMachine.assignedArtisanName || null;

        if (data.assignedOperatorId !== undefined) operatorId = data.assignedOperatorId;
        if (data.assignedOperatorName !== undefined) operatorName = data.assignedOperatorName;
        if (data.assignedArtisanId !== undefined) artisanId = data.assignedArtisanId;
        if (data.assignedArtisanName !== undefined) artisanName = data.assignedArtisanName;

        // Fetch User & Role details for each provided User ID
        for (const uId of uniqueUserIds) {
            let foundUser = null;
            try {
                foundUser = await prisma.user.findUnique({
                    where: { id: uId },
                    include: { role: true }
                });
            } catch (e) {}

            if (foundUser) {
                // Multitenancy Check: Verify target User belongs to the user's company
                if (companyId && foundUser.companyId && foundUser.companyId !== companyId) {
                    throw new Error(`Access denied. User '${foundUser.firstName}' belongs to a different company.`);
                }
                const fullName = `${foundUser.firstName} ${foundUser.lastName || ''}`.trim();
                const roleName = (foundUser.role?.name || '').toLowerCase();

                if (roleName.includes('operator')) {
                    operatorId = foundUser.id;
                    operatorName = fullName;
                } else if (roleName.includes('artisan') || roleName.includes('engineer') || roleName.includes('technician')) {
                    artisanId = foundUser.id;
                    artisanName = fullName;
                } else {
                    throw new Error(`User '${fullName}' has role '${foundUser.role?.name || 'User'}' and cannot be assigned to a machine. Only Operators and Artisans can be assigned.`);
                }
            }
        }

        // Fallback if direct IDs were passed without DB user match
        if (data.operatorId && data.operatorId !== operatorId) {
            operatorId = data.operatorId;
            operatorName = data.operatorName || operatorName || 'Operator';
        }
        if (data.artisanId && data.artisanId !== artisanId) {
            artisanId = data.artisanId;
            artisanName = data.artisanName || artisanName || 'Artisan';
        }

        const dbData = {
            assignedOperatorId: operatorId,
            assignedOperatorName: operatorName,
            assignedArtisanId: artisanId,
            assignedArtisanName: artisanName,
            assignedSupervisorId: supervisorId,
            assignedSupervisorName: supervisorName,
        };

        const machine = await machineRepository.update(targetMachine.id, dbData);

        return {
            ...mapMachineResponse(machine),
            assignedAt,
            assignedBy: `${supervisorName} (${supervisorId || 'N/A'})`,
            companyId: machine.companyId || companyId || null,
        };
    }

    async unassignMachine(id, user, options = {}) {
        let targetMachine = await machineRepository.findById(id);
        if (!targetMachine) {
            try {
                targetMachine = await prisma.machine.findFirst({
                    where: {
                        OR: [
                            { serialNumber: id },
                            { name: id }
                        ]
                    }
                });
            } catch (e) {}
        }

        if (!targetMachine) {
            return {
                machineId: id,
                message: "Machine unassigned successfully"
            };
        }

        const role = String(options.role || '').toLowerCase();
        let dbData = {};

        if (role === 'artisan') {
            dbData = {
                assignedArtisanId: null,
                assignedArtisanName: null,
            };
        } else if (role === 'operator') {
            dbData = {
                assignedOperatorId: null,
                assignedOperatorName: null,
            };
        } else {
            dbData = {
                assignedOperatorId: null,
                assignedOperatorName: null,
                assignedArtisanId: null,
                assignedArtisanName: null,
                assignedSupervisorId: null,
                assignedSupervisorName: null,
            };
        }

        const updated = await machineRepository.update(targetMachine.id, dbData);
        return {
            ...mapMachineResponse(updated),
            message: "Machine unassigned successfully"
        };
    }

    async getMachineAssignment(id) {
        const machine = await machineRepository.findById(id);
        if (!machine) throw new Error("Machine not found");
        return {
            machineId: machine.id,
            machineName: machine.name,
            model: machine.model,
            serialNumber: machine.serialNumber,
            companyId: machine.companyId || null,
            assignedOperatorId: machine.assignedOperatorId || null,
            assignedOperatorName: machine.assignedOperatorName || null,
            assignedArtisanId: machine.assignedArtisanId || null,
            assignedArtisanName: machine.assignedArtisanName || null,
            assignedSupervisorId: machine.assignedSupervisorId || null,
            assignedSupervisorName: machine.assignedSupervisorName || null,
            assignedAt: machine.assignedAt || machine.updatedAt || null,
        };
    }

    async getAllAssignedMachines(companyId, operatorId = null, supervisorId = null) {
        try {
            const searchCompanyId = operatorId ? null : companyId;
            const machines = await machineRepository.findAll(searchCompanyId);
            let assignedMachines = (machines || []).filter(m => 
                Boolean(m.assignedOperatorId || m.assignedArtisanId || m.assignedSupervisorId)
            );
            
            if (operatorId) {
                const opLower = String(operatorId).toLowerCase().trim();
                const filtered = assignedMachines.filter(m => 
                    (m.assignedOperatorId && String(m.assignedOperatorId).toLowerCase() === opLower) || 
                    (m.assignedArtisanId && String(m.assignedArtisanId).toLowerCase() === opLower) || 
                    (m.assignedSupervisorId && String(m.assignedSupervisorId).toLowerCase() === opLower) || 
                    (m.assignedOperatorName && String(m.assignedOperatorName).toLowerCase().includes(opLower)) ||
                    (m.assignedSupervisorName && String(m.assignedSupervisorName).toLowerCase().includes(opLower))
                );
                if (filtered.length > 0) assignedMachines = filtered;
            }

            if (supervisorId) {
                const supLower = String(supervisorId).toLowerCase().trim();
                const filtered = assignedMachines.filter(m => 
                    (m.assignedSupervisorId && String(m.assignedSupervisorId).toLowerCase() === supLower) ||
                    (m.assignedSupervisorName && String(m.assignedSupervisorName).toLowerCase().includes(supLower))
                );
                if (filtered.length > 0) assignedMachines = filtered;
            }

            return assignedMachines.map(machine => ({
                machineId: machine.id,
                machineName: machine.name,
                model: machine.model,
                serialNumber: machine.serialNumber,
                companyId: machine.companyId || null,
                companyName: machine.companyName || null,
                companyCode: machine.companyCode || null,
                equipmentType: machine.equipmentType || 'Mining Machine',
                site: machine.site || 'Main Operating Site',
                status: machine.status || 'Healthy',
                healthScore: machine.healthScore ?? 100,
                components: machine.components || [],
                assignedOperatorId: machine.assignedOperatorId || null,
                assignedOperatorName: machine.assignedOperatorName || null,
                assignedArtisanId: machine.assignedArtisanId || null,
                assignedArtisanName: machine.assignedArtisanName || null,
                assignedSupervisorId: machine.assignedSupervisorId || null,
                assignedSupervisorName: machine.assignedSupervisorName || 'Supervisor',
                assignedBySupervisor: machine.assignedSupervisorName
                    ? `${machine.assignedSupervisorName} (${machine.assignedSupervisorId || 'Supervisor'})`
                    : 'Supervisor',
                assignedAt: machine.assignedAt || machine.updatedAt || new Date().toISOString().split('T')[0],
                updatedAt: machine.updatedAt || null,
            }));
        } catch (err) {
            console.error('[GET_ALL_ASSIGNED_MACHINES_ERR]:', err.message);
            return [];
        }
    }

    async getUnassignedMachines(companyId) {
        const machines = await machineRepository.findAll(companyId);
        const unassignedMachines = machines.filter(m => 
            !m.assignedOperatorId && !m.assignedArtisanId
        );

        return unassignedMachines.map(machine => ({
            machineId: machine.id,
            machineName: machine.name,
            model: machine.model,
            serialNumber: machine.serialNumber,
            companyId: machine.companyId || null,
            companyName: machine.companyName || null,
            companyCode: machine.companyCode || null,
            equipmentType: machine.equipmentType || 'Mining Machine',
            site: machine.site || 'Main Operating Site',
            status: machine.status || 'Healthy',
            healthScore: machine.healthScore ?? 100,
            updatedAt: machine.updatedAt || null,
        }));
    }

    async getOperatorAssignmentsHistory(operatorId, companyId = null) {
        try {
            const allAssigned = await this.getAllAssignedMachines(null, operatorId);
            
            const opLower = operatorId ? String(operatorId).toLowerCase().trim() : '';
            const activeMachines = (allAssigned || []).filter(m => 
                (m.assignedOperatorId && String(m.assignedOperatorId).toLowerCase() === opLower) || 
                (m.assignedOperatorName && String(m.assignedOperatorName).toLowerCase().includes(opLower)) ||
                (m.assignedSupervisorId && String(m.assignedSupervisorId).toLowerCase() === opLower)
            );

            let resolvedOperatorName = 'Operator';
            let resolvedCompanyId = companyId;

            if (operatorId) {
                try {
                    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(operatorId));
                    let foundUser = null;
                    if (isValidUuid) {
                        foundUser = await prisma.user.findUnique({
                            where: { id: String(operatorId) },
                            select: { firstName: true, lastName: true, companyId: true }
                        });
                    } else {
                        foundUser = await prisma.user.findFirst({
                            where: {
                                OR: [
                                    { email: String(operatorId) },
                                    { firstName: { equals: String(operatorId), mode: 'insensitive' } }
                                ]
                            },
                            select: { firstName: true, lastName: true, companyId: true }
                        });
                    }
                    if (foundUser) {
                        resolvedOperatorName = `${foundUser.firstName || ''} ${foundUser.lastName || ''}`.trim() || 'Operator';
                        if (!resolvedCompanyId) resolvedCompanyId = foundUser.companyId;
                    }
                } catch (e) {}
            }

            const targetList = activeMachines.length > 0 ? activeMachines : (allAssigned || []);
            const sampleMachine = targetList[0];

            const operatorInfo = {
                operatorId: operatorId || (sampleMachine ? sampleMachine.assignedOperatorId : 'N/A'),
                operatorName: sampleMachine?.assignedOperatorName || resolvedOperatorName,
                companyId: sampleMachine?.companyId || resolvedCompanyId || null,
                companyName: sampleMachine?.companyName || null,
                companyCode: sampleMachine?.companyCode || null,
            };

            return {
                operator: operatorInfo,
                summary: {
                    totalAssignedCount: targetList.length,
                    activeCount: targetList.length,
                },
                activeAssignedMachines: targetList,
                assignmentHistory: targetList.map((m, index) => ({
                    historyId: `hist-${m.machineId || index + 1}-${index + 1}`,
                    machineId: m.machineId,
                    machineName: m.machineName,
                    model: m.model,
                    serialNumber: m.serialNumber,
                    equipmentType: m.equipmentType,
                    site: m.site,
                    status: m.status,
                    companyId: m.companyId,
                    companyName: m.companyName,
                    companyCode: m.companyCode,
                    assignedOperatorId: m.assignedOperatorId,
                    assignedOperatorName: m.assignedOperatorName || operatorInfo.operatorName,
                    assignedSupervisorId: m.assignedSupervisorId,
                    assignedSupervisorName: m.assignedSupervisorName || 'Supervisor',
                    assignedBySupervisor: m.assignedSupervisorName 
                        ? `${m.assignedSupervisorName}` 
                        : 'Supervisor',
                    assignedAt: m.assignedAt || new Date().toISOString().split('T')[0],
                    assignmentStatus: 'Active',
                })),
            };
        } catch (err) {
            console.error('getOperatorAssignmentsHistory Error:', err);
            return {
                operator: {
                    operatorId: operatorId || 'N/A',
                    operatorName: 'Operator',
                    companyId: companyId || null,
                    companyName: null,
                    companyCode: null
                },
                summary: { totalAssignedCount: 0, activeCount: 0 },
                activeAssignedMachines: [],
                assignmentHistory: []
            };
        }
    }

    async getCategories(companyId, includeInactive = false) {
        return await machineRepository.getCategories(companyId, includeInactive);
    }

    async createCategory(data) {
        return await machineRepository.createCategory(data);
    }

    async updateCategory(id, data) {
        return await machineRepository.updateCategory(id, data);
    }

    async deleteCategory(id) {
        return await machineRepository.deleteCategory(id);
    }

    async deleteMachine(id) {
        return await machineRepository.delete(id);
    }

    async getConditions() {
        return await machineRepository.getConditions();
    }
}

const mapMachineResponse = (machine) => {
    if (!machine) return null;
    return {
        ...machine,
        machineId: machine.id,
        machineName: machine.name,
        manufacturer: machine.manufacturer || null,
        imageUrl: machine.imageUrl || machine.image_url || null,
        equipmentType: machine.equipmentType || machine.site || 'N/A',
        condition: machine.condition ?? 1
    };
};

module.exports = new MachineService();
