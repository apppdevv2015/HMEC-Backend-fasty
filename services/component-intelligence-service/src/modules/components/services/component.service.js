const componentRepository = require('../repositories/component.repository');
const intelligenceService = require('../../intelligence/services/intelligence.service');
const { notifyUser, notifyRoles } = require("../../../../../../shared/notifications/notificationPublisher");
const redisModule = require("../../../../../auth-service/src/redis/redis.client");
const prisma = require("../../../database/prismaClient");


class ComponentService {
        async addComponent(data) {
        if (data.plannedLife <= 0) data.plannedLife = 1;
        const component = await componentRepository.create(data);

        await notifyRoles(prisma, redisModule, {
            companyId: data.companyId,
            roles: ['ADMIN', 'SUB_ADMIN'],
            title: 'New Component Registered',
            message: `Component "${component.name || component.description}" registered.`,
            type: 'Component',
            entityType: 'Component',
            entityId: component.id,
        });

        return component;
    }

    /**
     * Get the full component register with calculated intelligence metrics
     * This logic powers the dashboard table view
     */
    async getComponentRegister(companyId, machineId) {
        const components = await componentRepository.findAll(companyId, machineId);
        return intelligenceService.processRegister(components);
    }

       async updateComponent(id, data) {
        const component = await componentRepository.update(id, data);

        await notifyRoles(prisma, redisModule, {
            companyId: component.companyId,
            roles: ['ADMIN', 'SUB_ADMIN'],
            title: 'Component Updated',
            message: `Component "${component.name}" was updated.`,
            type: 'Component',
            entityType: 'Component',
            entityId: component.id,
        });

        return component;
    }

    /**
     * Get summary statistics for the dashboard cards
     */
    async getDashboardStats(companyId) {
        const components = await this.getComponentRegister(companyId);
        
        return {
            totalComponents: components.length,
            critical: components.filter(c => c.intelligence.riskStatus === 'Critical').length,
            warning: components.filter(c => c.intelligence.riskStatus === 'Warning').length,
            healthy: components.filter(c => c.intelligence.riskStatus === 'Healthy').length,
            totalReplacementCost: components.reduce((sum, c) => sum + Number(c.replacementCost), 0)
        };
    }

    /**
     * Inspect component - restricted to staff/engineers belonging to the same company
     */
    async inspectComponent(id, data, companyId, role) {
        // 1. Fetch component with machine details
        const component = await componentRepository.findById(id);
        if (!component) {
            throw new Error('Component not found');
        }

        // 2. Multi-tenant isolation guardrail: Check if component belongs to the engineer's company
        // Super Admins and Sub Super Admins can bypass this check
        if (role !== 'super_admin' && role !== 'sub_super_admin' && component.machine.companyId !== companyId) {
            throw new Error('Access denied: You are not authorized to inspect this component.');
        }

                // 3. Perform update (only operational fields currentHours and condition allowed)
        const updateData = {
            currentHours: data.currentHours,
            condition: data.condition
        };

        const updated = await componentRepository.update(id, updateData);

        if (updated.assignedSupervisorId) {
            await notifyUser(prisma, redisModule, {
                companyId,
                userId: updated.assignedSupervisorId,
                title: 'Component Inspected',
                message: `Component "${updated.name}" inspected. Condition: ${updated.condition}, Hours: ${updated.currentHours}.`,
                type: 'Inspection',
                entityType: 'Component',
                entityId: id,
            });
        }

        await notifyRoles(prisma, redisModule, {
            companyId,
            roles: ['ADMIN', 'SUB_ADMIN'],
            title: 'Component Inspected',
            message: `Component "${updated.name}" inspected. Condition: ${updated.condition}, Hours: ${updated.currentHours}.`,
            type: 'Inspection',
            entityType: 'Component',
            entityId: id,
        });

        return updated;
    }

      async deleteComponent(id) {
        const existing = await componentRepository.findById(id);
        const deleted = await componentRepository.delete(id);

        if (existing) {
            await notifyRoles(prisma, redisModule, {
                companyId: existing.companyId,
                roles: ['ADMIN', 'SUB_ADMIN'],
                title: 'Component Deleted',
                message: `Component "${existing.name}" was removed.`,
                type: 'Component',
                severity: 'warning',
                entityType: 'Component',
                entityId: id,
            });
        }

        return deleted;
    }

    /**
     * Fetch components filtered by machineId or companyId with intelligence metrics
     */
    async getComponents(query, companyId) {
        if (query.machineId) {
            const components = await componentRepository.findByMachineId(query.machineId);
            return intelligenceService.processRegister(components);
        }
        const components = await componentRepository.findAll(companyId);
        return intelligenceService.processRegister(components);
    }

async getEngineerDashboardComponents(companyId) {
    if (!companyId) {
        throw new Error('Company ID is required');
    }

    const components =
        await componentRepository.findAllForEngineerDashboard(companyId);

    return intelligenceService.processRegister(components);
}

}

module.exports = new ComponentService();
