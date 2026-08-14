const machineRepository = require('../repositories/machine.repository');
const { createClient } = require('redis');
const prisma = require('../../../database/prismaClient');

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
        const dbData = {
            name: data.name,
            model: data.model,
            serialNumber: data.serialNumber,
            companyId: data.companyId,
            site: data.equipmentType || data.site || null,
            costPerHourTarget: data.costPerHourTarget || null,
            costPerTonTarget: data.costPerTonTarget || null
        };
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
        const machines = await machineRepository.findAll(companyId);
        return machines.map(mapMachineResponse);
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
        if (data.model !== undefined) dbData.model = data.model;
        if (data.serialNumber !== undefined) dbData.serialNumber = data.serialNumber;
        if (data.equipmentType !== undefined) dbData.site = data.equipmentType;
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
        
        const machine = await machineRepository.update(id, dbData);
        return mapMachineResponse(machine);
    }

    async getCategories(companyId) {
        return await machineRepository.getCategories(companyId);
    }

    async createCategory(data) {
        return await machineRepository.createCategory(data);
    }

    async deleteCategory(id) {
        return await machineRepository.deleteCategory(id);
    }

    async deleteMachine(id) {
        return await machineRepository.delete(id);
    }
}

const mapMachineResponse = (machine) => {
    if (!machine) return null;
    return {
        ...machine,
        equipmentType: machine.site || 'N/A'
    };
};

module.exports = new MachineService();
