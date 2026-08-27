const jwt = require('jsonwebtoken');
const prisma = require('../../../database/prismaClient');
const healthEngineService = require('../services/healthEngine.service');
const equipmentSpecMasterService = require('../services/equipmentSpecMaster.service');
const responseHandler = require('../../../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

class ManualInspectionController {
    submitManualData = async (req, res) => {
        try {
            const machineId = req.params.id;
            const {
                readings = {},
                checklist = {},
                customFields = [],
                componentCategory = 'General',
                componentName = '',
                brand = '',
                category = '',
                modelName = '',
                serialNumber = '',
                machineName = '',
                companyId: bodyCompanyId,
                companyName: bodyCompanyName,
                userId: bodyUserId,
                userName: bodyUserName,
                userRole: bodyUserRole,
                userEmail: bodyUserEmail
            } = req.body;

            const compName = String(componentName || componentCategory || 'General').trim();

            const userRole = bodyUserRole || req.user?.role || 'COMPANY_ADMIN';
            const isSuperAdmin = String(userRole || '').toLowerCase().includes('super') && !bodyCompanyId;

            // 1. Extract Company & User information (Multi-tenant Tracking)
            let companyId = bodyCompanyId || (isSuperAdmin ? null : (req.user?.companyId || null));
            let companyName = bodyCompanyName || null;
            if (companyId && !companyName) {
                try {
                    const compRec = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });
                    if (compRec) companyName = compRec.name;
                } catch (e) { /* ignore */ }
            }

            const userId = bodyUserId || req.user?.id || req.user?.userId || null;
            const userName = bodyUserName || req.user?.name || req.user?.firstName || (isSuperAdmin ? 'Super Admin' : 'Company Staff');
            const userEmail = bodyUserEmail || req.user?.email || null;

            const finalMachineName = machineName || modelName || 'Mining Equipment';
            const finalBrand = brand || 'Caterpillar';
            const finalCategory = category || 'General';
            const finalModelName = modelName || finalMachineName;
            const finalSerialNumber = serialNumber || `SN-${finalBrand.toUpperCase().substring(0, 4)}-${Math.abs(machineId.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0) % 9000 + 1000)}`;

            // 2. Ensure Machine row exists in public.machines table (Auto-provision per company from Master Catalog if needed)
            let targetCompanyId = req.user?.companyId || companyId;
            if (!targetCompanyId) {
                try {
                    const defaultComp = await prisma.company.findFirst();
                    if (defaultComp) targetCompanyId = defaultComp.id;
                } catch (e) {}
            }

            let resolvedMachine = null;
            let targetMachineId = machineId;
            try {
                if (targetCompanyId) {
                    resolvedMachine = await prisma.machine.findFirst({
                        where: {
                            companyId: targetCompanyId,
                            OR: [
                                { id: machineId },
                                { serialNumber: finalSerialNumber },
                                { name: finalMachineName, model: finalModelName }
                            ]
                        }
                    });

                    if (resolvedMachine) {
                        targetMachineId = resolvedMachine.id;
                    } else {
                        // Check if primary key machineId is already used by another record
                        const existingIdCheck = await prisma.machine.findUnique({ where: { id: machineId } });
                        const generatedId = existingIdCheck ? require('crypto').randomUUID() : machineId;

                        resolvedMachine = await prisma.machine.create({
                            data: {
                                id: generatedId,
                                name: finalMachineName,
                                manufacturer: finalBrand,
                                model: finalModelName,
                                serialNumber: finalSerialNumber,
                                equipmentType: finalCategory,
                                companyId: targetCompanyId,
                                healthScore: 100,
                                status: 'Healthy'
                            }
                        });
                        targetMachineId = resolvedMachine.id;
                    }
                }
            } catch (mErr) {
                console.warn('[MACHINE_AUTO_PROVISION_WARN]:', mErr.message);
            }

            // 3. Check if Multi-Component Batch Inspection Payload is sent
            const isBatch = Array.isArray(req.body.components) && req.body.components.length > 0;

            if (isBatch) {
                const batchComponents = req.body.components;
                const processedComponents = [];
                const allParameterChanges = [];
                const allIssues = [];
                let hasAnyChanges = false;

                for (const c of batchComponents) {
                    const cName = c.componentName || c.componentCategory || 'General Component';
                    const cCategory = c.componentCategory || 'General';
                    const cParams = c.customFields || [];

                    // Find previous readings for this component
                    let prevParams = null;
                    try {
                        const prevRec = await prisma.componentHealth.findFirst({
                            where: { machineId: targetMachineId, componentName: cName },
                            orderBy: { updatedAt: 'desc' }
                        });
                        if (prevRec && prevRec.parameters) prevParams = prevRec.parameters;
                    } catch (e) {}

                    // Calculate component health
                    const safeParams = JSON.parse(JSON.stringify(cParams));
                    const cHealth = healthEngineService.calculateHealth(c.readings, c.checklist, safeParams);
                    if (cHealth.issues && cHealth.issues.length > 0) {
                        allIssues.push(...cHealth.issues.map(iss => `[${cName}] ${iss}`));
                    }

                    // Calculate Parameter Diffs
                    const compChanges = [];
                    if (prevParams && Array.isArray(prevParams)) {
                        const prevMap = new Map();
                        prevParams.forEach(p => {
                            if (p && p.name) prevMap.set(String(p.name).trim().toLowerCase(), p.value);
                        });

                        safeParams.forEach(curr => {
                            if (!curr || !curr.name) return;
                            const key = String(curr.name).trim().toLowerCase();
                            const oldVal = prevMap.get(key);
                            if (oldVal !== undefined && oldVal !== null && String(oldVal) !== String(curr.value)) {
                                const oldNum = parseFloat(oldVal);
                                const newNum = parseFloat(curr.value);
                                const changeDelta = (!isNaN(oldNum) && !isNaN(newNum)) ? Math.round((newNum - oldNum) * 100) / 100 : null;
                                compChanges.push({
                                    componentName: cName,
                                    parameterName: curr.name,
                                    unit: curr.unit || '',
                                    previousValue: oldVal,
                                    updatedValue: curr.value,
                                    delta: changeDelta,
                                    safeMin: curr.safeMin,
                                    safeMax: curr.safeMax,
                                    summary: `[${cName}] ${curr.name}: ${oldVal} -> ${curr.value} ${curr.unit || ''}`
                                });
                            }
                        });
                    }

                    if (compChanges.length > 0) {
                        hasAnyChanges = true;
                        allParameterChanges.push(...compChanges);
                    }

                    processedComponents.push({
                        componentName: cName,
                        componentCategory: cCategory,
                        healthScore: cHealth.healthScore,
                        status: cHealth.status,
                        parameters: safeParams,
                        previousParameters: prevParams,
                        issues: cHealth.issues || []
                    });
                }

                // Execute all database writes atomically using Prisma $transaction
                let overallMachineHealth = 100;
                let machineStatus = 'Healthy';
                let auditLogRow = null;
                const batchActionType = hasAnyChanges ? 'ROUTINE_UPDATE' : 'INITIAL_INSPECTION';

                await prisma.$transaction(async (tx) => {
                    // 1. Atomically Upsert ComponentHealth records
                    for (const comp of processedComponents) {
                        const existingRec = await tx.componentHealth.findFirst({
                            where: { machineId: targetMachineId, componentName: comp.componentName }
                        });

                        if (existingRec) {
                            await tx.componentHealth.update({
                                where: { id: existingRec.id },
                                data: {
                                    componentName: comp.componentName,
                                    serialNumber: finalSerialNumber,
                                    parameters: comp.parameters,
                                    healthScore: comp.healthScore,
                                    status: comp.status,
                                    updatedAt: new Date()
                                }
                            });
                        } else {
                            await tx.componentHealth.create({
                                data: {
                                    machineId: targetMachineId,
                                    componentName: comp.componentName,
                                    serialNumber: finalSerialNumber,
                                    parameters: comp.parameters,
                                    healthScore: comp.healthScore,
                                    status: comp.status
                                }
                            });
                        }
                    }

                    // 2. Compute aggregate Machine Health across ALL installed components in tx
                    const allCompRecords = await tx.componentHealth.findMany({
                        where: { machineId: targetMachineId }
                    });

                    if (allCompRecords.length > 0) {
                        const totalScore = allCompRecords.reduce((sum, c) => sum + (c.healthScore || 0), 0);
                        overallMachineHealth = Math.round(totalScore / allCompRecords.length);

                        const hasCritical = allCompRecords.some(c => c.status === 'Critical' || (c.healthScore || 0) < 50);
                        const hasWarning = allCompRecords.some(c => c.status === 'Warning' || ((c.healthScore || 0) >= 50 && (c.healthScore || 0) < 85));

                        if (hasCritical) machineStatus = 'Critical';
                        else if (hasWarning) machineStatus = 'Warning';
                        else machineStatus = 'Healthy';
                    }

                    if (resolvedMachine) {
                        await tx.machine.update({
                            where: { id: targetMachineId },
                            data: {
                                healthScore: overallMachineHealth,
                                status: machineStatus
                            }
                        });
                    }

                    // 3. INSERT EXACTLY ONE CONSOLIDATED AUDIT LOG ROW FOR THE ENTIRE MACHINE INSPECTION
                    auditLogRow = await tx.machineInspectionAuditLog.create({
                        data: {
                            actionType: batchActionType,
                            companyId,
                            companyName,
                            userId,
                            userName,
                            userRole,
                            userEmail,
                            machineId,
                            machineName: finalMachineName,
                            serialNumber: finalSerialNumber,
                            brand: finalBrand,
                            category: finalCategory,
                            modelName: finalModelName,
                            componentId: null,
                            componentName: `All Components (${batchComponents.length} Components)`,
                            previousParameters: null,
                            currentParameters: processedComponents,
                            parameterChanges: allParameterChanges.length > 0 ? allParameterChanges : null,
                            componentHealthScore: overallMachineHealth,
                            overallMachineHealth,
                            status: machineStatus,
                            issues: allIssues.length > 0 ? allIssues : null
                        }
                    });
                });

                return responseHandler(res, HTTP_STATUS.OK, true, `Full machine inspection saved (${batchComponents.length} components). Machine Health: ${overallMachineHealth}% (${machineStatus})`, {
                    actionType: batchActionType,
                    auditLog: auditLogRow,
                    machineHealth: {
                        machineId,
                        overallMachineHealth,
                        machineStatus
                    },
                    components: processedComponents,
                    parameterChanges: allParameterChanges
                });
            }

            // 3. Find previous component readings (to calculate Parameter Diff) - SINGLE COMPONENT FALLBACK
            let previousParams = null;
            try {
                const prevRecord = await prisma.componentHealth.findFirst({
                    where: {
                        machineId: targetMachineId,
                        componentName: compName
                    },
                    orderBy: { updatedAt: 'desc' }
                });
                if (prevRecord && prevRecord.parameters) {
                    previousParams = prevRecord.parameters;
                }
            } catch (e) { /* ignore */ }

            // 4. Calculate Health Status & Score using Health Engine
            const safeParams = JSON.parse(JSON.stringify(
                customFields && customFields.length > 0 ? customFields : { readings, checklist, customFields }
            ));

            const healthResult = healthEngineService.calculateHealth(readings, checklist, safeParams);

            // 5. Calculate Parameter Diffs (Old Values vs New Values)
            const parameterChanges = [];
            let isInitial = true;

            if (previousParams && Array.isArray(previousParams)) {
                isInitial = false;
                const prevMap = new Map();
                previousParams.forEach(p => {
                    if (p && p.name) prevMap.set(String(p.name).trim().toLowerCase(), p.value);
                });

                if (Array.isArray(safeParams)) {
                    safeParams.forEach(curr => {
                        if (!curr || !curr.name) return;
                        const key = String(curr.name).trim().toLowerCase();
                        const oldVal = prevMap.get(key);
                        if (oldVal !== undefined && oldVal !== null && oldVal !== curr.value) {
                            const oldNum = parseFloat(oldVal);
                            const newNum = parseFloat(curr.value);
                            const changeDelta = (!isNaN(oldNum) && !isNaN(newNum)) ? Math.round((newNum - oldNum) * 100) / 100 : null;

                            parameterChanges.push({
                                parameterName: curr.name,
                                unit: curr.unit || '',
                                previousValue: oldVal,
                                updatedValue: curr.value,
                                delta: changeDelta,
                                safeMin: curr.safeMin,
                                safeMax: curr.safeMax,
                                summary: `${curr.name}: ${oldVal} -> ${curr.value} ${curr.unit || ''}`
                            });
                        }
                    });
                }
            }

            const actionType = isInitial || parameterChanges.length === 0 ? 'INITIAL_INSPECTION' : 'ROUTINE_UPDATE';

            // 6. Update or Create ComponentHealth record in public.component_health DB table
            let componentHealthRecord = null;
            try {
                const existingRec = await prisma.componentHealth.findFirst({
                    where: { machineId: targetMachineId, componentName: compName }
                });

                if (existingRec) {
                    componentHealthRecord = await prisma.componentHealth.update({
                        where: { id: existingRec.id },
                        data: {
                            componentName: compName,
                            serialNumber: finalSerialNumber,
                            parameters: safeParams,
                            healthScore: healthResult.healthScore,
                            status: healthResult.status,
                            updatedAt: new Date()
                        }
                    });
                } else {
                    componentHealthRecord = await prisma.componentHealth.create({
                        data: {
                            machineId: targetMachineId,
                            componentName: compName,
                            serialNumber: finalSerialNumber,
                            parameters: safeParams,
                            healthScore: healthResult.healthScore,
                            status: healthResult.status
                        }
                    });
                }
            } catch (e) {
                console.warn('[COMPONENT_HEALTH_SYNC_WARN]:', e.message);
            }

            // 7. Calculate Overall Machine Health Score across all components
            let overallMachineHealth = healthResult.healthScore;
            let machineStatus = healthResult.status;

            try {
                const allCompRecords = await prisma.componentHealth.findMany({
                    where: { machineId: targetMachineId }
                });

                if (allCompRecords.length > 0) {
                    const totalScore = allCompRecords.reduce((sum, c) => sum + (c.healthScore || 0), 0);
                    overallMachineHealth = Math.round(totalScore / allCompRecords.length);

                    const hasCritical = allCompRecords.some(c => c.status === 'Critical' || (c.healthScore || 0) < 50);
                    const hasWarning = allCompRecords.some(c => c.status === 'Warning' || ((c.healthScore || 0) >= 50 && (c.healthScore || 0) < 85));

                    if (hasCritical) machineStatus = 'Critical';
                    else if (hasWarning) machineStatus = 'Warning';
                    else machineStatus = 'Healthy';
                }

                if (resolvedMachine) {
                    await prisma.machine.update({
                        where: { id: targetMachineId },
                        data: {
                            healthScore: overallMachineHealth,
                            status: machineStatus
                        }
                    });
                }
            } catch (e) {
                console.warn('[MACHINE_AGGREGATE_HEALTH_WARN]:', e.message);
            }

            // 8. INSERT IMMUTABLE AUDIT LOG ROW INTO PostgreSQL DB Table (machine_inspection_audit_logs)
            let auditLogRow = null;
            try {
                auditLogRow = await prisma.machineInspectionAuditLog.create({
                    data: {
                        actionType,
                        companyId,
                        companyName,
                        userId,
                        userName,
                        userRole,
                        userEmail,
                        machineId,
                        machineName: finalMachineName,
                        serialNumber: finalSerialNumber,
                        brand: finalBrand,
                        category: finalCategory,
                        modelName: finalModelName,
                        componentId: componentHealthRecord?.componentId || null,
                        componentName: compName,
                        previousParameters: previousParams,
                        currentParameters: safeParams,
                        parameterChanges: parameterChanges.length > 0 ? parameterChanges : null,
                        componentHealthScore: healthResult.healthScore,
                        overallMachineHealth,
                        status: healthResult.status,
                        issues: healthResult.issues && healthResult.issues.length > 0 ? healthResult.issues : null
                    }
                });
            } catch (auditErr) {
                console.error('[AUDIT_LOG_INSERT_ERR]:', auditErr);
            }

            return responseHandler(res, HTTP_STATUS.OK, true, `Inspection saved for ${compName}. Status: ${healthResult.status} (${healthResult.healthScore}%)`, {
                actionType,
                auditLog: auditLogRow,
                componentHealth: {
                    componentName: compName,
                    healthScore: healthResult.healthScore,
                    status: healthResult.status,
                    issues: healthResult.issues
                },
                machineHealth: {
                    machineId,
                    overallMachineHealth,
                    machineStatus
                },
                parameterChanges
            });
        } catch (error) {
            console.error('[MANUAL_INSPECTION_SUBMIT_ERROR]:', error);
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message || 'Inspection submit error');
        }
    };

    getManualData = async (req, res) => {
        try {
            const machineId = req.params.id;

            const records = await prisma.componentHealth.findMany({
                where: { machineId },
                orderBy: { updatedAt: 'desc' }
            });

            const seenNames = new Set();
            const uniqueRecords = [];
            for (const r of records) {
                const key = String(r.componentName || r.componentId || r.id).toLowerCase().trim();
                if (!seenNames.has(key)) {
                    seenNames.add(key);
                    uniqueRecords.push(r);
                }
            }

            let overallMachineHealth = 100;
            let machineStatus = 'Healthy';
            if (uniqueRecords.length > 0) {
                const totalScore = uniqueRecords.reduce((sum, c) => sum + (c.healthScore || 0), 0);
                overallMachineHealth = Math.round(totalScore / uniqueRecords.length);

                const hasCritical = uniqueRecords.some(c => c.status === 'Critical' || (c.healthScore || 0) < 50);
                const hasWarning = uniqueRecords.some(c => c.status === 'Warning' || ((c.healthScore || 0) >= 50 && (c.healthScore || 0) < 85));

                if (hasCritical) machineStatus = 'Critical';
                else if (hasWarning) machineStatus = 'Warning';
                else machineStatus = 'Healthy';
            }

            // Fetch persistent audit logs from PostgreSQL table
            let historyLogs = [];
            try {
                historyLogs = await prisma.machineInspectionAuditLog.findMany({
                    where: { machineId },
                    orderBy: { createdAt: 'desc' },
                    take: 50
                });
            } catch (e) {
                console.warn('[AUDIT_LOG_FETCH_WARN]:', e.message);
            }

            return responseHandler(res, HTTP_STATUS.OK, true, 'Manual data fetched successfully', {
                machine: {
                    id: machineId,
                    healthScore: overallMachineHealth,
                    status: machineStatus
                },
                records: uniqueRecords,
                historyLogs
            });
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    /**
     * Get Equipment Spec Template from Master Catalog (Caterpillar, Komatsu, Volvo, etc.)
     * Scoped strictly by Company ID so each company sees only OEM standard components + their own custom added components!
     */
    getEquipmentTemplate = async (req, res) => {
        try {
            const { equipmentType = '', modelName = '', machineId = '', companyId: queryCompanyId = '' } = req.query;
            let targetCompanyId = req.user?.companyId || queryCompanyId || null;

            // Auto-decode companyId from Authorization token header if present
            if (!targetCompanyId && req.headers?.authorization?.startsWith('Bearer ')) {
                try {
                    const token = req.headers.authorization.split(' ')[1];
                    const decoded = jwt.decode(token);
                    if (decoded?.companyId) targetCompanyId = decoded.companyId;
                } catch (e) {}
            }

            // 1. Get Base OEM Spec Template from Master Catalog
            const template = await equipmentSpecMasterService.getSpecTemplate(equipmentType, modelName);
            const baseComponents = Array.isArray(template.components) ? [...template.components] : [];

            // 2. Fetch Custom Components from PostgreSQL database ONLY for the specified companyId
            if (targetCompanyId) {
                try {
                    const customComponentsFromDB = await prisma.component.findMany({
                        where: { companyId: targetCompanyId },
                        include: {
                            machine: true
                        }
                    });

                    if (customComponentsFromDB && customComponentsFromDB.length > 0) {
                        const targetModelLower = String(modelName || '').toLowerCase().trim();
                        const targetMachineId = String(machineId || '').toLowerCase().trim();

                        const matchedComps = customComponentsFromDB.filter(c => {
                            if (!c.name) return false;
                            const cMachineId = String(c.machineId || '').toLowerCase().trim();
                            const cDesc = String(c.description || '').toLowerCase().trim();
                            const cMachineModel = String(c.machine?.model || '').toLowerCase().trim();
                            const cMachineName = String(c.machine?.name || '').toLowerCase().trim();

                            // Match by machineId
                            if (targetMachineId && cMachineId === targetMachineId) return true;

                            // Match by modelName / description
                            if (targetModelLower) {
                                if (cDesc && (targetModelLower.includes(cDesc) || cDesc.includes(targetModelLower))) return true;
                                if (cMachineModel && (targetModelLower.includes(cMachineModel) || cMachineModel.includes(targetModelLower))) return true;
                                if (cMachineName && (targetModelLower.includes(cMachineName) || cMachineName.includes(targetModelLower))) return true;
                                
                                const modelKeywords = targetModelLower.split(' ').filter(w => w.length > 3);
                                if (modelKeywords.some(kw => cDesc.includes(kw) || cMachineModel.includes(kw) || cMachineName.includes(kw))) return true;
                            }
                            return false;
                        });

                        matchedComps.forEach(c => {
                            const compName = c.name || 'Custom Component';
                            // Avoid duplicate if already exists in base OEM components
                            if (!baseComponents.some(bc => (bc.name || '').toLowerCase() === compName.toLowerCase())) {
                                const rawParams = c.inspectionParameters || [];
                                const parsedParams = Array.isArray(rawParams) ? rawParams : (typeof rawParams === 'string' ? JSON.parse(rawParams) : []);
                                
                                baseComponents.push({
                                    id: c.id,
                                    name: compName,
                                    category: c.category || 'Equipment Component',
                                    isCustom: true,
                                    companyId: targetCompanyId,
                                    parameters: parsedParams.length > 0 ? parsedParams : [
                                        { name: 'Operating Parameter', unit: 'Units', safeMin: 0, safeMax: 100, defaultVal: 50, description: 'Custom parameter' }
                                    ]
                                });
                            }
                        });
                    }
                } catch (dbCompErr) {
                    console.warn('[COMPANY_CUSTOM_COMP_FETCH_WARN]:', dbCompErr.message);
                }
            }

            return responseHandler(res, HTTP_STATUS.OK, true, 'Equipment spec template fetched successfully', {
                ...template,
                companyId: targetCompanyId,
                components: baseComponents
            });
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    /**
     * Save Custom Component linked strictly to a Company & Machine in PostgreSQL Database
     */
    saveCustomComponent = async (req, res) => {
        try {
            const {
                companyId: bodyCompanyId,
                machineId = '',
                modelName = '',
                equipmentType = 'General',
                name,
                componentName,
                category = 'Equipment Component',
                parameters = []
            } = req.body;

            const targetCompanyId = req.user?.companyId || bodyCompanyId;
            if (!targetCompanyId) {
                return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, 'Company ID is required to save custom component');
            }

            const compName = String(name || componentName || '').trim();
            if (!compName) {
                return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, 'Component Name is required');
            }

            // 1. Ensure machine record exists for this company
            let targetMachine = null;
            if (machineId) {
                targetMachine = await prisma.machine.findFirst({
                    where: {
                        companyId: targetCompanyId,
                        OR: [{ id: machineId }, { serialNumber: machineId }, { model: modelName }]
                    }
                });
            }

            if (!targetMachine && modelName) {
                targetMachine = await prisma.machine.findFirst({
                    where: {
                        companyId: targetCompanyId,
                        model: modelName
                    }
                });
            }

            if (!targetMachine) {
                const uniqueSN = `SN-${targetCompanyId.substring(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
                targetMachine = await prisma.machine.create({
                    data: {
                        name: modelName || 'Company Machine',
                        model: modelName || 'Company Machine',
                        serialNumber: uniqueSN,
                        equipmentType: equipmentType || 'Equipment',
                        companyId: targetCompanyId,
                        healthScore: 100,
                        status: 'Healthy'
                    }
                });
            }

            // 2. Create or Update Component in PostgreSQL Component Table
            let existingComponent = await prisma.component.findFirst({
                where: {
                    companyId: targetCompanyId,
                    machineId: targetMachine.id,
                    name: compName
                }
            });

            if (!existingComponent) {
                existingComponent = await prisma.component.create({
                    data: {
                        name: compName,
                        category: category || 'Equipment Component',
                        componentType: category || 'Equipment Component',
                        description: modelName || compName,
                        serialNumber: `CMP-${Date.now().toString(36).toUpperCase()}`,
                        companyId: targetCompanyId,
                        machineId: targetMachine.id,
                        inspectionParameters: parameters,
                        healthScore: 100,
                        condition: 5
                    }
                });
            } else {
                existingComponent = await prisma.component.update({
                    where: { id: existingComponent.id },
                    data: {
                        inspectionParameters: parameters,
                        category: category || existingComponent.category,
                        description: modelName || existingComponent.description,
                        updatedAt: new Date()
                    }
                });
            }

            return responseHandler(res, HTTP_STATUS.OK, true, `Component "${compName}" successfully saved to company equipment`, existingComponent);
        } catch (error) {
            console.error('[SAVE_CUSTOM_COMPONENT_ERR]:', error);
            return responseHandler(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
        }
    };

    /**
     * Assign Machine from Master Catalog to Company Fleet
     */
    assignMachineToCompanyFleet = async (req, res) => {
        try {
            const {
                companyId: bodyCompanyId,
                modelName = '',
                brand = '',
                category = '',
                serialNumber = '',
                name = '',
                site = 'Main Mining Site'
            } = req.body;

            let targetCompanyId = req.user?.companyId || bodyCompanyId;
            if (!targetCompanyId && req.headers?.authorization?.startsWith('Bearer ')) {
                try {
                    const token = req.headers.authorization.split(' ')[1];
                    const decoded = jwt.decode(token);
                    if (decoded?.companyId) targetCompanyId = decoded.companyId;
                } catch (e) {}
            }

            if (!targetCompanyId) {
                return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, 'Company ID is required');
            }

            const effectiveModel = String(modelName || name || 'Equipment').trim();
            const effectiveName = String(name || modelName || 'Company Machine').trim();
            const effectiveSN = String(serialNumber || '').trim() || `SN-${String(brand || 'HME').substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

            // Check if already in company fleet
            let machine = await prisma.machine.findFirst({
                where: {
                    companyId: targetCompanyId,
                    OR: [
                        { serialNumber: effectiveSN },
                        { model: effectiveModel },
                        { name: effectiveName }
                    ]
                },
                include: {
                    components: true
                }
            });

            if (machine) {
                return responseHandler(res, HTTP_STATUS.OK, true, `"${machine.name}" is already active in your company fleet`, {
                    machine,
                    alreadyAssigned: true
                });
            }

            // Create new machine in Company Fleet
            machine = await prisma.machine.create({
                data: {
                    name: effectiveName,
                    model: effectiveModel,
                    manufacturer: brand,
                    serialNumber: effectiveSN,
                    equipmentType: category ,
                    site: site || null,
                    companyId: targetCompanyId,
                    healthScore: 100,
                    status: 'Healthy'
                }
            });

            // Auto-populate standard OEM components into Component table
            try {
                const specTpl = await equipmentSpecMasterService.getSpecTemplate(category, effectiveModel);
                if (specTpl && Array.isArray(specTpl.components) && specTpl.components.length > 0) {
                    for (const sc of specTpl.components) {
                        const compSN = `CMP-${String(sc.name).substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
                        await prisma.component.create({
                            data: {
                                name: sc.name,
                                category: sc.category || 'Equipment Component',
                                componentType: sc.category || 'Equipment Component',
                                description: effectiveModel,
                                serialNumber: compSN,
                                companyId: targetCompanyId,
                                machineId: machine.id,
                                inspectionParameters: sc.parameters || [],
                                healthScore: 100,
                                condition: 5
                            }
                        });
                    }
                }
            } catch (tplErr) {
                console.warn('[AUTO_POPULATE_COMPONENTS_WARN]:', tplErr.message);
            }

            // Also create a fleet notification
            try {
                await prisma.notification.create({
                    data: {
                        companyId: targetCompanyId,
                        message: `🚚 [FLEET] New Equipment "${machine.name}" (${machine.model}) registered to Company Fleet.`,
                        type: 'fleet',
                        isRead: false
                    }
                });
            } catch (notifErr) {}

            return responseHandler(res, HTTP_STATUS.CREATED, true, `"${machine.name}" successfully added to your Company Fleet!`, {
                machine,
                alreadyAssigned: false
            });
        } catch (err) {
            console.error('[ASSIGN_MACHINE_ERROR]:', err);
            return responseHandler(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, err.message);
        }
    };

    /**
     * Get Company Fleet Machines (Only machines registered to this company)
     */
    getCompanyFleetMachines = async (req, res) => {
        try {
            let targetCompanyId = req.user?.companyId || req.query.companyId;
            if ((!targetCompanyId || targetCompanyId === 'undefined' || targetCompanyId === 'null') && req.headers?.authorization?.startsWith('Bearer ')) {
                try {
                    const token = req.headers.authorization.split(' ')[1];
                    const decoded = jwt.decode(token);
                    if (decoded?.companyId) targetCompanyId = decoded.companyId;
                    if (!targetCompanyId && decoded?.id) {
                        const dbUser = await prisma.user.findUnique({ where: { id: decoded.id }, select: { companyId: true } });
                        if (dbUser?.companyId) targetCompanyId = dbUser.companyId;
                    }
                } catch (e) {}
            }

            if (!targetCompanyId || targetCompanyId === 'undefined' || targetCompanyId === 'null') {
                return responseHandler(res, HTTP_STATUS.OK, true, 'No company fleet found', []);
            }

            let effectiveCompanyId = targetCompanyId;
            try {
                const matchedCompany = await prisma.company.findFirst({
                    where: {
                        OR: [
                            { id: targetCompanyId },
                            { companyCode: targetCompanyId }
                        ]
                    }
                });
                if (matchedCompany) {
                    effectiveCompanyId = matchedCompany.id;
                }
            } catch (compLookupErr) {}

            const machines = await prisma.machine.findMany({
                where: { companyId: effectiveCompanyId },
                include: {
                    components: true
                },
                orderBy: { createdAt: 'desc' }
            });

            return responseHandler(res, HTTP_STATUS.OK, true, 'Company fleet machines fetched', machines || []);
        } catch (err) {
            console.error('[GET_COMPANY_FLEET_ERR]:', err);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Company fleet machines (empty fallback)', []);
        }
    };

    /**
     * Unassign / Remove Machine from Company Fleet
     */
    unassignMachineFromCompanyFleet = async (req, res) => {
        try {
            const machineId = req.params.id;
            let targetCompanyId = req.user?.companyId || req.query.companyId || req.body?.companyId;
            if (!targetCompanyId && req.headers?.authorization?.startsWith('Bearer ')) {
                try {
                    const token = req.headers.authorization.split(' ')[1];
                    const decoded = jwt.decode(token);
                    if (decoded?.companyId) targetCompanyId = decoded.companyId;
                } catch (e) {}
            }

            const targetMachine = await prisma.machine.findFirst({
                where: {
                    id: machineId,
                    ...(targetCompanyId ? { companyId: targetCompanyId } : {})
                }
            });

            if (!targetMachine) {
                return responseHandler(res, HTTP_STATUS.NOT_FOUND, false, 'Machine not found in company fleet');
            }

            // Cleanup related records
            await prisma.componentCost.deleteMany({ where: { component: { machineId: targetMachine.id } } }).catch(() => {});
            await prisma.componentHealth.deleteMany({ where: { machineId: targetMachine.id } }).catch(() => {});
            await prisma.failurePrediction.deleteMany({ where: { component: { machineId: targetMachine.id } } }).catch(() => {});
            await prisma.component.deleteMany({ where: { machineId: targetMachine.id } }).catch(() => {});
            await prisma.machineInspectionAuditLog.deleteMany({ where: { machineId: targetMachine.id } }).catch(() => {});
            await prisma.jobCard.deleteMany({ where: { machineId: targetMachine.id } }).catch(() => {});
            await prisma.maintenanceLog.deleteMany({ where: { machineId: targetMachine.id } }).catch(() => {});
            await prisma.recommendation.deleteMany({ where: { machineId: targetMachine.id } }).catch(() => {});
            await prisma.machine.delete({ where: { id: targetMachine.id } });

            return responseHandler(res, HTTP_STATUS.OK, true, `"${targetMachine.name}" has been removed from your Company Fleet`);
        } catch (err) {
            console.error('[UNASSIGN_MACHINE_ERROR]:', err);
            return responseHandler(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, err.message);
        }
    };

    /**
     * Get Master Equipment Catalog Filter Metadata (Categories, Brands, Total Counts)
     */
    getMasterCatalogFilters = async (req, res) => {
        try {
            const filters = await equipmentSpecMasterService.getFiltersMetadata();
            return responseHandler(res, HTTP_STATUS.OK, true, 'Master equipment catalog filters fetched', filters);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    /**
     * Get Master Equipment Catalog list directly from PostgreSQL Database Table with High-Performance Pagination
     */
    getMasterCatalog = async (req, res) => {
        try {
            const { page, limit, search = '', brand = '', category = '', includeComponents } = req.query;

            const isAllRequested = String(limit).toLowerCase() === 'all';
            const isExplicitPagination = page !== undefined || limit !== undefined || Boolean(search) || (Boolean(brand) && brand !== 'ALL') || (Boolean(category) && category !== 'ALL');

            if (!isExplicitPagination || isAllRequested) {
                const catalog = await equipmentSpecMasterService.getFullCatalogFromDB();
                const uniqueBrands = new Set(catalog.map(c => c.brand).filter(Boolean));
                const uniqueCategories = new Set(catalog.map(c => c.category).filter(Boolean));
                const totalSpecs = catalog.reduce((sum, c) => sum + (Number(c.totalSpecsCount) || 0), 0);

                return responseHandler(res, HTTP_STATUS.OK, true, 'Master equipment catalog fetched from database table', {
                    totalBrands: uniqueBrands.size,
                    totalCategories: uniqueCategories.size,
                    totalMachines: catalog.length,
                    totalSpecs: totalSpecs,
                    pagination: {
                        page: 1,
                        limit: catalog.length,
                        totalItems: catalog.length,
                        totalPages: 1
                    },
                    catalog
                });
            }

            const result = await equipmentSpecMasterService.getCatalogFromDB({
                page: page || 1,
                limit: limit || 25,
                search,
                brand,
                category,
                includeComponents: includeComponents === 'true' || includeComponents === true
            });

            return responseHandler(res, HTTP_STATUS.OK, true, 'Master equipment catalog fetched from database table', {
                totalBrands: result.totalBrands || 0,
                totalCategories: result.totalCategories || 0,
                totalMachines: result.pagination.totalItems,
                totalSpecs: result.catalog.reduce((sum, c) => sum + (Number(c.totalSpecsCount) || 0), 0),
                pagination: result.pagination,
                catalog: result.catalog
            });
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    /**
     * Get Chronological Inspection History Logs directly from PostgreSQL Database Table
     * Super Admin sees platform-wide logs; Company Admin & tenant roles only see their own company's logs.
     */
    getInspectionHistory = async (req, res) => {
        try {
            const machineId = req.params.id;
            const { companyId: queryCompanyId, category, brand, limit = 50 } = req.query;

            const userRole = req.user?.role;
            const isSuperAdmin = String(userRole || '').toLowerCase().includes('super');

            const whereClause = {};
            if (machineId && machineId !== 'all') whereClause.machineId = machineId;
            if (category) whereClause.category = category;
            if (brand) whereClause.brand = brand;

            // Strict Multi-Tenant Filter:
            // Non-SuperAdmin users (Company Admin, Artisans, Supervisors) only see their company logs
            let targetCompanyId = req.user?.companyId || queryCompanyId;
            if (!isSuperAdmin) {
                if (!targetCompanyId && req.user?.id) {
                    try {
                        const dbUser = await prisma.user.findUnique({
                            where: { id: req.user.id },
                            select: { companyId: true }
                        });
                        if (dbUser?.companyId) targetCompanyId = dbUser.companyId;
                    } catch (e) {}
                }
                if (targetCompanyId) {
                    whereClause.OR = [
                        { companyId: targetCompanyId },
                        { companyId: null }
                    ];
                }
            } else if (queryCompanyId) {
                whereClause.companyId = queryCompanyId;
            }

            console.log(`[INSPECTION-HISTORY] fetching for user=${req.user?.email || 'anon'} role=${userRole} company=${targetCompanyId}`);

            const historyLogs = await prisma.machineInspectionAuditLog.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit, 10) || 50
            });

            return responseHandler(res, HTTP_STATUS.OK, true, 'Inspection history logs fetched successfully from database table', {
                totalEntries: historyLogs.length,
                historyLogs
            });
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    /**
     * Submit supervisor review and remarks for an inspection log in PostgreSQL
     */
    reviewInspectionHistoryLog = async (req, res) => {
        try {
            const { id } = req.params;
            const { supervisorRemarks, reviewRating, supervisorName, operatorName, machineName } = req.body;
            
            let updatedLog = null;
            try {
                updatedLog = await prisma.machineInspectionAuditLog.update({
                    where: { id },
                    data: {
                        status: 'Approved & Verified',
                        issues: {
                            supervisorRemarks: supervisorRemarks || '',
                            reviewRating: reviewRating || '5/5 Excellent Execution',
                            reviewedAt: new Date().toISOString(),
                            supervisorName: supervisorName || req.user?.name || req.user?.firstName || 'Supervisor',
                            operatorName: operatorName || 'Operator'
                        }
                    }
                });
            } catch (e) {
                // Ignore if row doesn't match ID
            }

            // Create notification in PostgreSQL table
            try {
                const targetCompanyId = req.user?.companyId || updatedLog?.companyId;
                if (targetCompanyId) {
                    await prisma.notification.create({
                        data: {
                            companyId: targetCompanyId,
                            type: 'SUPERVISOR_INSPECTION_REVIEW',
                            message: `Supervisor ${supervisorName || 'Supervisor'} reviewed pre-start inspection for ${machineName || 'Machine'} (${reviewRating || '5/5'}): "${supervisorRemarks || 'Verified'}"`,
                            isRead: false
                        }
                    });
                }
            } catch (notifErr) {
                console.warn('[NOTIF_CREATE_WARN]:', notifErr.message);
            }

            return responseHandler(res, HTTP_STATUS.OK, true, 'Supervisor review recorded in database successfully', {
                log: updatedLog,
                supervisorRemarks,
                reviewRating
            });
        } catch (err) {
            console.error('[REVIEW_INSPECTION_LOG_ERR]:', err);
            return responseHandler(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, err.message);
        }
    };

    /**
     * Get Categories / Equipment Types for Company
     */
    getCategories = async (req, res) => {
        try {
            let targetCompanyId = req.user?.companyId || req.query.companyId;
            if ((!targetCompanyId || targetCompanyId === 'undefined' || targetCompanyId === 'null') && req.headers?.authorization?.startsWith('Bearer ')) {
                try {
                    const token = req.headers.authorization.split(' ')[1];
                    const decoded = jwt.decode(token);
                    if (decoded?.companyId) targetCompanyId = decoded.companyId;
                    if (!targetCompanyId && decoded?.id) {
                        const dbUser = await prisma.user.findUnique({ where: { id: decoded.id }, select: { companyId: true } });
                        if (dbUser?.companyId) targetCompanyId = dbUser.companyId;
                    }
                } catch (e) {}
            }

            if (!targetCompanyId || targetCompanyId === 'undefined' || targetCompanyId === 'null') {
                return responseHandler(res, HTTP_STATUS.OK, true, 'Machine categories fetched successfully', []);
            }

            // 1. Fetch custom categories created for this company
            const customCategories = await prisma.machineCategory.findMany({
                where: {
                    OR: [
                        { companyId: targetCompanyId },
                        { companyId: null }
                    ]
                },
                orderBy: { createdAt: 'desc' }
            });

            // 2. Fetch company fleet machines to get equipment types currently owned
            const fleetMachines = await prisma.machine.findMany({
                where: { companyId: targetCompanyId },
                select: { equipmentType: true, name: true, model: true }
            });

            // 3. Count machine occurrences per equipment type
            const fleetCatMap = new Map();
            fleetMachines.forEach(m => {
                const cat = (m.equipmentType || '').trim();
                if (cat) {
                    const current = fleetCatMap.get(cat) || { count: 0, models: [] };
                    current.count += 1;
                    current.models.push(m.model || m.name);
                    fleetCatMap.set(cat, current);
                }
            });

            // Combine both: start with custom categories
            const result = customCategories.map(c => ({
                id: c.id,
                name: c.name,
                description: c.description || 'Custom Company Equipment Type',
                icon: c.icon || 'Truck',
                isActive: c.isActive,
                companyId: c.companyId || targetCompanyId,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
                isCustom: true
            }));

            // Add fleet equipment types if not already present
            fleetCatMap.forEach((info, catName) => {
                const exists = result.some(c => c.name.toLowerCase() === catName.toLowerCase());
                if (!exists) {
                    const lower = catName.toLowerCase();
                    const icon = lower.includes('crane') ? 'Wrench' : lower.includes('truck') || lower.includes('dump') ? 'Truck' : lower.includes('excavator') ? 'Layers' : 'Truck';
                    result.push({
                        id: `fleet-${catName.toLowerCase().replace(/\s+/g, '-')}`,
                        name: catName,
                        description: `Active Company Fleet (${info.count} machine${info.count > 1 ? 's' : ''}: ${info.models.slice(0, 2).join(', ')}${info.models.length > 2 ? '...' : ''})`,
                        icon,
                        isActive: true,
                        companyId: targetCompanyId,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        isCustom: false,
                        machineCount: info.count
                    });
                }
            });

            return responseHandler(res, HTTP_STATUS.OK, true, 'Machine categories fetched successfully', result);
        } catch (err) {
            console.error('[GET_CATEGORIES_ERR]:', err);
            return responseHandler(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, err.message);
        }
    };

    /**
     * Create Custom Category / Equipment Type
     */
    createCategory = async (req, res) => {
        try {
            const { name, description, icon } = req.body || {};
            if (!name || !name.trim()) {
                return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, 'Equipment Type Name is required');
            }

            let targetCompanyId = req.user?.companyId || req.body?.companyId;
            if (!targetCompanyId && req.headers?.authorization?.startsWith('Bearer ')) {
                try {
                    const token = req.headers.authorization.split(' ')[1];
                    const decoded = jwt.decode(token);
                    if (decoded?.companyId) targetCompanyId = decoded.companyId;
                } catch (e) {}
            }

            if (!targetCompanyId || targetCompanyId === 'undefined' || targetCompanyId === 'null') {
                return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, 'Company ID is required to create an equipment type');
            }

            const existing = await prisma.machineCategory.findFirst({
                where: {
                    name: name.trim(),
                    companyId: targetCompanyId
                }
            });

            if (existing) {
                return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, 'An equipment type with this name already exists for your company');
            }

            const category = await prisma.machineCategory.create({
                data: {
                    name: name.trim(),
                    description: description?.trim() || null,
                    icon: icon || 'Truck',
                    companyId: targetCompanyId,
                    isActive: true
                }
            });

            return responseHandler(res, HTTP_STATUS.CREATED, true, 'Equipment type created successfully', category);
        } catch (err) {
            console.error('[CREATE_CATEGORY_ERR]:', err);
            return responseHandler(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, err.message);
        }
    };

    /**
     * Update Custom Category / Equipment Type
     */
    updateCategory = async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, icon, isActive } = req.body || {};

            if (id.startsWith('fleet-')) {
                return responseHandler(res, HTTP_STATUS.OK, true, 'Fleet category status updated');
            }

            const category = await prisma.machineCategory.update({
                where: { id },
                data: {
                    ...(name ? { name: name.trim() } : {}),
                    ...(description !== undefined ? { description: description?.trim() || null } : {}),
                    ...(icon !== undefined ? { icon } : {}),
                    ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {})
                }
            });

            return responseHandler(res, HTTP_STATUS.OK, true, 'Equipment type updated successfully', category);
        } catch (err) {
            console.error('[UPDATE_CATEGORY_ERR]:', err);
            return responseHandler(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, err.message);
        }
    };

    /**
     * Delete Custom Category / Equipment Type
     */
    deleteCategory = async (req, res) => {
        try {
            const { id } = req.params;
            if (id.startsWith('fleet-')) {
                return responseHandler(res, HTTP_STATUS.OK, true, 'Category removed from view');
            }
            await prisma.machineCategory.delete({ where: { id } }).catch(() => {});
            return responseHandler(res, HTTP_STATUS.OK, true, 'Equipment type deleted successfully');
        } catch (err) {
            console.error('[DELETE_CATEGORY_ERR]:', err);
            return responseHandler(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, err.message);
        }
    };

    /**
     * Delete Inspection Audit Log Record
     */
    deleteInspectionHistoryLog = async (req, res) => {
        try {
            const { id } = req.params;
            await prisma.machineInspectionAuditLog.delete({
                where: { id }
            }).catch(() => {});
            return responseHandler(res, HTTP_STATUS.OK, true, 'Inspection log record deleted successfully');
        } catch (err) {
            console.error('[DELETE_INSPECTION_LOG_ERR]:', err);
            return responseHandler(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, err.message);
        }
    };
}

module.exports = new ManualInspectionController();
