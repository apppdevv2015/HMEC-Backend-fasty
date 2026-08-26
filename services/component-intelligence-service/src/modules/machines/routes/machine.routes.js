const machineController = require('../controllers/machine.controller');
const manualInspectionController = require('../controllers/manualInspection.controller');
const componentController = require('../../components/controllers/component.controller');
const { authMiddleware, isAdmin, canAssignMachine } = require('../../../middlewares/auth.middleware');
const machineValidation = require('../../../validations/machine.validation');

async function machineRoutes(fastify, options) {
    // Add Machine
    fastify.post('/', { 
        schema: {
            description: 'Create and register a new machine in company equipment fleet',
            tags: ['Machines & Master Catalog'],
            summary: 'Register New Machine'
        },
        preHandler: [authMiddleware, isAdmin, machineValidation] 
    }, machineController.addMachine);

    // List Machines
    fastify.get('/', { 
        schema: {
            description: 'List all registered fleet machines for company with pagination & filtering',
            tags: ['Machines & Master Catalog'],
            summary: 'List Company Fleet Machines'
        },
        preHandler: authMiddleware 
    }, machineController.getMachines);

    // Spec Template (Company Scoped)
    fastify.get('/spec-template', {
        schema: {
            description: 'Get Equipment Spec Template by Equipment Type & Model Name with Company-Scoped Custom Components',
            tags: ['Machines & Master Catalog'],
            summary: 'Get Equipment Spec Template'
        }
    }, manualInspectionController.getEquipmentTemplate);

    // Save Custom Component (Company Scoped)
    fastify.post('/custom-components', {
        schema: {
            description: 'Add a new custom component and inspection parameters to a company equipment asset',
            tags: ['Machines & Master Catalog'],
            summary: 'Save Custom Component to Company Machine'
        }
    }, manualInspectionController.saveCustomComponent);

    // Assign Machine to Company Fleet (1-Click Fleet Registration)
    fastify.post('/assign-to-company', {
        schema: {
            description: 'Assign a machine model from Master Catalog into Company Fleet',
            tags: ['Machines & Master Catalog'],
            summary: 'Assign Machine to Company Fleet'
        }
    }, manualInspectionController.assignMachineToCompanyFleet);

    // Unassign / Remove Machine from Company Fleet
    fastify.delete('/assign-to-company/:id', {
        schema: {
            description: 'Remove a machine from Company Fleet',
            tags: ['Machines & Master Catalog'],
            summary: 'Remove Machine from Company Fleet'
        }
    }, manualInspectionController.unassignMachineFromCompanyFleet);

    // List Company Fleet Machines
    fastify.get('/company-fleet', {
        schema: {
            description: 'List all active equipment registered in company fleet',
            tags: ['Machines & Master Catalog'],
            summary: 'Get Company Fleet Equipment'
        }
    }, manualInspectionController.getCompanyFleetMachines);

    // Public Endpoint for Filter Metadata (Categories, Brands, Counts)
    fastify.get('/master-catalog/filters', {
        schema: {
            description: 'Get Distinct Categories and Brands with Machine Counts for Master Equipment Catalog Filters',
            tags: ['Machines & Master Catalog'],
            summary: 'Get Master Catalog Filter Metadata (Public)'
        }
    }, manualInspectionController.getMasterCatalogFilters);

    // Public Endpoint (No Middleware) + Swagger Documentation
    fastify.get('/master-catalog', {
        schema: {
            description: 'Get Master Equipment Catalog (9,742+ Machines, 91+ Brands, 55 Categories) directly from PostgreSQL Database Table with High-Performance Pagination',
            tags: ['Machines & Master Catalog'],
            summary: 'Get 9,742+ Heavy Equipment Master Catalog Dataset (Public)'
        }
    }, manualInspectionController.getMasterCatalog);

    // Dedicated Assigned & Operator Assignment Endpoints
    fastify.get('/assignments', { 
        schema: {
            description: 'Get all assigned machines for the company',
            tags: ['Machine Assignment & Fleet'],
            summary: 'Get Assigned Machines List'
        },
        preHandler: authMiddleware 
    }, machineController.getAllAssignedMachines);

    fastify.get('/operator-assignments', { 
        schema: {
            description: 'Get the logged-in Operator active assigned machine and assignment history',
            tags: ['Machine Assignment & Fleet'],
            summary: 'Get Logged-in Operator Assignment History'
        },
        preHandler: authMiddleware 
    }, machineController.getOperatorAssignmentsHistory);

    fastify.get('/operator/:operatorId/assignments', { 
        schema: {
            description: 'Get specific Operator assignment history by operatorId',
            tags: ['Machine Assignment & Fleet'],
            summary: 'Get Operator Assignment History by ID'
        },
        preHandler: authMiddleware 
    }, machineController.getOperatorAssignmentsHistory);

    fastify.get('/assigned', { 
        schema: {
            description: 'Get all machines currently assigned to Operators, Artisans, or Supervisors',
            tags: ['Machine Assignment & Fleet'],
            summary: 'Get All Assigned Machines',
            querystring: {
                type: 'object',
                properties: {
                    companyId: { type: 'string', description: 'Filter by Company ID' },
                    operatorId: { type: 'string', description: 'Filter by Operator User ID' }
                }
            },
            response: {
                200: {
                    description: 'List of assigned machines with operator and artisan details',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'array' },
                        error: { type: ['string', 'null'] },
                        timestamp: { type: 'string' }
                    }
                }
            }
        },
        preHandler: authMiddleware 
    }, machineController.getAllAssignedMachines);

    fastify.get('/all/assigned', { 
        schema: {
            description: 'Alias endpoint to retrieve all assigned machines',
            tags: ['Machine Assignment & Fleet'],
            summary: 'Get All Assigned Machines (Alias)',
            querystring: {
                type: 'object',
                properties: {
                    companyId: { type: 'string', description: 'Filter by Company ID' },
                    operatorId: { type: 'string', description: 'Filter by Operator User ID' }
                }
            }
        },
        preHandler: authMiddleware 
    }, machineController.getAllAssignedMachines);

    // Dedicated Unassigned Machines Endpoints
    fastify.get('/unassigned', { 
        schema: {
            description: 'Get all machines in the company fleet that currently have NO operator and NO artisan assigned',
            tags: ['Machine Assignment & Fleet'],
            summary: 'Get All Unassigned Machines',
            querystring: {
                type: 'object',
                properties: {
                    companyId: { type: 'string', description: 'Filter by Company ID' }
                }
            },
            response: {
                200: {
                    description: 'List of unassigned machines available for assignment',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'array' },
                        error: { type: ['string', 'null'] },
                        timestamp: { type: 'string' }
                    }
                }
            }
        },
        preHandler: authMiddleware 
    }, machineController.getUnassignedMachines);

    fastify.get('/all/unassigned', { 
        schema: {
            description: 'Alias endpoint to retrieve all unassigned machines',
            tags: ['Machine Assignment & Fleet'],
            summary: 'Get All Unassigned Machines (Alias)',
            querystring: {
                type: 'object',
                properties: {
                    companyId: { type: 'string', description: 'Filter by Company ID' }
                }
            }
        },
        preHandler: authMiddleware 
    }, machineController.getUnassignedMachines);

    // Machine Equipment Types / Categories (Company Fleet + Custom)
    fastify.get('/categories', {
        schema: {
            description: 'Get all equipment categories / types for company',
            tags: ['Machines & Master Catalog'],
            summary: 'Get Equipment Categories'
        }
    }, manualInspectionController.getCategories);

    fastify.post('/categories', {
        schema: {
            description: 'Create a custom equipment category / type for company',
            tags: ['Machines & Master Catalog'],
            summary: 'Create Custom Equipment Category'
        }
    }, manualInspectionController.createCategory);

    fastify.put('/categories/:id', {
        schema: {
            description: 'Update a custom equipment category / type',
            tags: ['Machines & Master Catalog'],
            summary: 'Update Equipment Category'
        }
    }, manualInspectionController.updateCategory);

    fastify.delete('/categories/:id', {
        schema: {
            description: 'Delete a custom equipment category / type',
            tags: ['Machines & Master Catalog'],
            summary: 'Delete Equipment Category'
        }
    }, manualInspectionController.deleteCategory);

    // Delete Inspection Audit Log Record
    fastify.delete('/inspection-history/:id', {
        schema: {
            description: 'Delete an inspection audit log record',
            tags: ['Machines & Master Catalog'],
            summary: 'Delete Inspection Audit Log Record'
        },
        preHandler: authMiddleware
    }, manualInspectionController.deleteInspectionHistoryLog);

    // Get Machine Details by ID
    fastify.get('/:id', { 
        schema: {
            description: 'Get full details, components, and real-time health score of a single machine by ID',
            tags: ['Machines & Master Catalog'],
            summary: 'Get Machine Details by ID',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Machine ID or Serial Number' }
                },
                required: ['id']
            }
        },
        preHandler: authMiddleware 
    }, machineController.getMachineById);

    // Get all components belonging to a machine by machine ID
    fastify.get('/:id/components', { 
        schema: {
            description: 'Get all components, specifications, and live health metrics for a specific machine by ID',
            tags: ['Machines & Master Catalog'],
            summary: 'Get Machine Components'
        },
        preHandler: authMiddleware 
    }, machineController.getMachineComponents);

    // Get current assignment details for a machine
    fastify.get('/:id/assign', { 
        schema: {
            description: 'Fetch current Operator, Artisan, and Supervisor assignment metadata for a machine',
            tags: ['Machine Assignment & Fleet'],
            summary: 'Get Current Machine Assignment Details',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Machine ID or Serial Number' }
                },
                required: ['id']
            }
        },
        preHandler: authMiddleware 
    }, machineController.getMachineAssignment);

    // Assign machine by machine ID (Supervisors, Admins, Managers)
    fastify.post('/:id/assign', { 
        schema: {
            description: 'Assign an Operator and/or Artisan to a machine. Supervised and scoped by company context.',
            tags: ['Machine Assignment & Fleet'],
            summary: 'Assign Operator / Artisan to Machine',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Machine ID to assign' }
                },
                required: ['id']
            },
            body: {
                type: 'object',
                properties: {
                    operatorId: { type: 'string', description: 'User ID of the assigned Operator' },
                    operatorName: { type: 'string', description: 'Name of the Operator' },
                    artisanId: { type: 'string', description: 'User ID of the assigned Artisan' },
                    artisanName: { type: 'string', description: 'Name of the Artisan' },
                    companyId: { type: 'string', description: 'Target Company ID' }
                }
            },
            response: {
                200: {
                    description: 'Machine assignment updated successfully',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'object' },
                        error: { type: ['string', 'null'] },
                        timestamp: { type: 'string' }
                    }
                }
            }
        },
        preHandler: [authMiddleware, canAssignMachine] 
    }, machineController.assignMachine);

    // Unassign machine by machine ID (Supervisors, Admins, Managers)
    fastify.delete('/:id/assign', { 
        schema: {
            description: 'Unassign and clear Operator, Artisan, and Supervisor assignments from a machine',
            tags: ['Machine Assignment & Fleet'],
            summary: 'Unassign Machine from Operator & Artisan',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Machine ID or Serial Number to unassign' }
                },
                required: ['id']
            },
            response: {
                200: {
                    description: 'Machine successfully unassigned and moved to unassigned fleet',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'object' },
                        error: { type: ['string', 'null'] },
                        timestamp: { type: 'string' }
                    }
                }
            }
        },
        preHandler: [authMiddleware, canAssignMachine] 
    }, machineController.unassignMachine);

    // Manual Data Entry & Inspection Routes
    fastify.post('/:id/manual-data', { 
        schema: {
            description: 'Submit manual parameter inspection readings for machine components and compute real-time health score',
            tags: ['Machine Inspection & Health Audit'],
            summary: 'Submit Component Inspection Readings',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Machine ID' }
                },
                required: ['id']
            }
        },
        preHandler: authMiddleware 
    }, manualInspectionController.submitManualData);

    fastify.get('/:id/manual-data', { 
        schema: {
            description: 'Get latest recorded component inspection data and health score for a machine',
            tags: ['Machine Inspection & Health Audit'],
            summary: 'Get Latest Inspection Data by Machine ID',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Machine ID' }
                },
                required: ['id']
            }
        },
        preHandler: authMiddleware 
    }, manualInspectionController.getManualData);

    fastify.get('/inspection-history', { 
        schema: {
            description: 'Get chronological inspection history audit trail logs across company fleet',
            tags: ['Machine Inspection & Health Audit'],
            summary: 'Get All Fleet Machine Inspection History'
        },
        preHandler: authMiddleware 
    }, manualInspectionController.getInspectionHistory);

    fastify.post('/inspection-history/:id/review', { 
        schema: {
            description: 'Submit supervisor review, rating, and remarks for an inspection audit log in database',
            tags: ['Machine Inspection & Health Audit'],
            summary: 'Record Supervisor Inspection Review'
        },
        preHandler: authMiddleware 
    }, manualInspectionController.reviewInspectionHistoryLog);

    fastify.get('/:id/inspection-history', { 
        schema: {
            description: 'Get chronological inspection history audit trail logs for a machine',
            tags: ['Machine Inspection & Health Audit'],
            summary: 'Get Machine Inspection History & Audit Trail',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Machine ID' }
                },
                required: ['id']
            }
        },
        preHandler: authMiddleware 
    }, manualInspectionController.getInspectionHistory);

    // Aliases for Frontend Inspection Service
    fastify.get('/:id/inspection/components', { preHandler: authMiddleware }, componentController.getComponentsByMachineId);
    fastify.get('/:id/inspection', { preHandler: authMiddleware }, manualInspectionController.getManualData);
    fastify.post('/:id/inspection', { preHandler: authMiddleware }, manualInspectionController.submitManualData);
    fastify.post('/:id/inspection/submit', { preHandler: authMiddleware }, manualInspectionController.submitManualData);
    fastify.post('/:id/inspection/draft', { preHandler: authMiddleware }, manualInspectionController.submitManualData);
    
    // Save component inspection from machine context
    fastify.put('/:id/inspection/components/:componentId', { preHandler: authMiddleware }, async (request, reply) => {
        const { componentId } = request.params;
        request.params.id = componentId;
        return componentController.updateComponent(request, reply);
    });
    
    // Update Machine
    fastify.put('/:id', { 
        schema: {
            description: 'Update machine metadata, operational site, or configuration (Admin only)',
            tags: ['Machines & Master Catalog'],
            summary: 'Update Machine Information',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Machine ID' }
                },
                required: ['id']
            }
        },
        preHandler: [authMiddleware, isAdmin, machineValidation] 
    }, machineController.updateMachine);

    // Delete Machine
    fastify.delete('/:id', { 
        schema: {
            description: 'Delete machine from company equipment fleet (Admin only)',
            tags: ['Machines & Master Catalog'],
            summary: 'Delete Machine'
        },
        preHandler: [authMiddleware, isAdmin] 
    }, machineController.deleteMachine);
}

module.exports = machineRoutes;
