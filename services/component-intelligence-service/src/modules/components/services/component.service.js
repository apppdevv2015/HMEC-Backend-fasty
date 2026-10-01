const componentRepository = require('../repositories/component.repository');
const intelligenceService = require('../../intelligence/services/intelligence.service');
const { notifyUser, notifyRoles } = require("../../../../../../shared/notifications/notificationPublisher");
const redisModule = require("../../../../../auth-service/src/redis/redis.client");
const prisma = require("../../../database/prismaClient");


class ComponentService {
        async addComponent(data) {
        if (data.plannedLife <= 0) data.plannedLife = 1;
                const machine = await prisma.machine.findFirst({
            where: { id: data.machineId, companyId: data.companyId },
            select: { id: true }
        });
        if (!machine) throw new Error('Machine not found for this company.');
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

  
    async getComponentRegister(companyId, machineId) {
        const components = await componentRepository.findAll(companyId, machineId);
        return intelligenceService.processRegister(components);
    }

       async updateComponent(id, data, companyId) {
        const component = await componentRepository.update(id, data, companyId);

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

   


    async getFinancialSummary(companyId) {
        const components = await this.getComponentRegister(companyId);
        const money = (c) => Number(c.replacementCost) || 0;
        const needsBudget = components.filter((c) =>
            ['Replace Now', 'Order Now', 'Plan Budget'].includes(c.intelligence.financialStatus)
        );

        const byMonthMap = {};
        const bySupplierMap = {};
        for (const c of needsBudget) {
            const month = c.intelligence.budgetMonth || 'Unscheduled';
            byMonthMap[month] = (byMonthMap[month] || 0) + money(c);

            const supplier = c.supplier || 'Unknown';
            if (!bySupplierMap[supplier]) bySupplierMap[supplier] = { supplier, components: 0, amount: 0 };
            bySupplierMap[supplier].components += 1;
            bySupplierMap[supplier].amount += money(c);
        }

        const row = (c) => ({
            id: c.id,
            name: c.name,
            machineName: c.machine?.name || null,
            supplier: c.supplier || null,
            healthPercent: c.intelligence.healthPercent,
            remainingHours: c.intelligence.remainingHours,
            replacementCost: money(c),
            leadTimeWeeks: c.leadTimeWeeks,
            orderByDate: c.intelligence.orderByDate,
            daysToOrder: c.intelligence.daysToOrder,
            budgetMonth: c.intelligence.budgetMonth,
            financialStatus: c.intelligence.financialStatus
        });

        const statusCount = (s) => components.filter((c) => c.intelligence.financialStatus === s).length;

        return {
            currency: components[0]?.currency || 'ZAR',
            totalComponents: components.length,
            totalReplacementValue: components.reduce((s, c) => s + money(c), 0),
            budgetRequired: needsBudget.reduce((s, c) => s + money(c), 0),
            statusCounts: {
                replaceNow: statusCount('Replace Now'),
                orderNow: statusCount('Order Now'),
                planBudget: statusCount('Plan Budget'),
                usageNotSet: statusCount('Usage Not Set'),
                ok: statusCount('OK')
            },
            monthlyForecast: Object.entries(byMonthMap)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([month, amount]) => ({ month, amount })),
            bySupplier: Object.values(bySupplierMap).sort((a, b) => b.amount - a.amount),
            actionRequired: components
                .filter((c) => ['Replace Now', 'Order Now'].includes(c.intelligence.financialStatus))
                .sort((a, b) => (a.intelligence.daysToOrder ?? -9999) - (b.intelligence.daysToOrder ?? -9999))
                .map(row),
            plannedBudget: components
                .filter((c) => c.intelligence.financialStatus === 'Plan Budget')
                .map(row)
        };
    }
    
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

    async inspectComponent(id, data, companyId, role) {
        // 1. Fetch component with machine details
        const component = await componentRepository.findById(id);
        if (!component) {
            throw new Error('Component not found');
        }

     
       if (role !== 'super_admin' && role !== 'sub_super_admin' && component.companyId !== companyId) {
            throw new Error('Access denied: You are not authorized to inspect this component.');
        }

                
        const updateData = {
            currentHours: data.currentHours,
            condition: data.condition
        };

               const isSuper = role === 'super_admin' || role === 'sub_super_admin';
        const updated = await componentRepository.update(id, updateData, isSuper ? null : companyId);
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

     async deleteComponent(id, companyId) {
        const existing = await componentRepository.findById(id);
        const deleted = await componentRepository.delete(id, companyId);

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

    async getComponents(query, companyId) {
        if (query.machineId) {
                        const components = await componentRepository.findByMachineId(query.machineId, companyId);
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
