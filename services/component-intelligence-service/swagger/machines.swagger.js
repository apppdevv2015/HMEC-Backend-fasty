/**
 * @swagger
 * tags:
 *   - name: Machine Category Create
 *     description: Machine Equipment Type Categories creation and management
 *   - name: Component Category Create
 *     description: Component Category creation and management
 *   - name: Machines
 *     description: Machine and equipment management
 *   - name: Machine Assignment & Fleet
 *     description: Operator & Artisan machine assignments, unassignment, and fleet allocation
 *   - name: Machine Inspection & Health Audit
 *     description: Engineering spec inspection readings, real-time health score calculation, and audit trails
 */

/**
 * @swagger
 * /machines/categories:
 *   post:
 *     summary: Create a Machine Equipment Category
 *     description: Company Admin token automatically binds companyId. companyId in request body is optional.
 *     tags: [Machine Category Create]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: 'Haul Truck 400T' }
 *               description: { type: string, example: 'Ultra-class heavy haul mining dump trucks' }
 *               icon: { type: string, example: 'Truck' }
 *               companyId: { type: string, example: 'COMP-101', description: 'Optional. Auto-filled from JWT token if omitted.' }
 *     responses:
 *       201:
 *         description: Machine Equipment Category created successfully
 *   get:
 *     summary: Get all Machine Equipment Categories
 *     tags: [Machine Category Create]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of Machine Equipment Categories
 *
 * /machines/categories/{id}:
 *   put:
 *     summary: Update an existing Machine Equipment Category (Edit)
 *     tags: [Machine Category Create]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: 'Haul Truck 400T Updated' }
 *               description: { type: string, example: 'Updated description' }
 *               icon: { type: string, example: 'Truck' }
 *     responses:
 *       200:
 *         description: Machine Equipment Category updated successfully
 *   delete:
 *     summary: Delete a Machine Equipment Category
 *     tags: [Machine Category Create]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Machine Equipment Category deleted successfully
 */

/**
 * @swagger
 * /machines/master-catalog:
 *   get:
 *     summary: Get 9,742+ Heavy Equipment Master Catalog (Public)
 *     description: Retrieve specifications across 9,742+ heavy machinery models, 91+ brands, and 55 categories with server-side pagination.
 *     tags: [Machines]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: string, default: '25' }
 *         description: Items per page or 'all'
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by model, brand, category, or power
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Filter by equipment category
 *       - in: query
 *         name: brand
 *         schema: { type: string }
 *         description: Filter by equipment brand
 *     responses:
 *       200:
 *         description: Master catalog dataset with pagination metadata
 *
 * /machines/master-catalog/filters:
 *   get:
 *     summary: Get Master Equipment Catalog Filter Metadata (Public)
 *     description: Returns distinct categories and brands with live machine counts for UI filter dropdowns.
 *     tags: [Machines]
 *     responses:
 *       200:
 *         description: Distinct categories and brands with counts
 */

/**
 * @swagger
 * /machines:
 *   post:
 *     summary: Register a new machine
 *     description: Company Admin token automatically binds companyId. companyId in request body is optional.
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, manufacturer, model, serialNumber, equipmentType]
 *             properties:
 *               name: { type: string, example: 'Haul Truck 101' }
 *               manufacturer: { type: string, example: 'Caterpillar' }
 *               model: { type: string, example: '777G' }
 *               serialNumber: { type: string, example: 'CAT-777G-001' }
 *               equipmentType: { type: string, example: 'Haul Truck' }
 *               site: { type: string, example: 'North Pit Mine' }
 *               companyId: { type: string, example: 'COMP-101', description: 'Optional. Auto-filled from JWT token if omitted.' }
 *     responses:
 *       201:
 *         description: Machine registered successfully
 *   get:
 *     summary: Get all registered machines with pagination & search
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search keyword
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of machines with pagination info
 */

/**
 * @swagger
 * /machines/assigned:
 *   get:
 *     summary: Get All Assigned Machines
 *     description: Retrieve all machines that currently have an Operator, Artisan, or Supervisor assigned.
 *     tags: [Machine Assignment & Fleet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: operatorId
 *         schema: { type: string }
 *         description: Filter assignments by Operator User ID
 *       - in: query
 *         name: companyId
 *         schema: { type: string }
 *         description: Filter by Company ID
 *     responses:
 *       200:
 *         description: List of assigned machines with operator and artisan details
 *
 * /machines/unassigned:
 *   get:
 *     summary: Get All Unassigned Machines
 *     description: Retrieve all machines in the company fleet that currently have NO operator and NO artisan assigned.
 *     tags: [Machine Assignment & Fleet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema: { type: string }
 *         description: Filter by Company ID
 *     responses:
 *       200:
 *         description: List of unassigned machines available for allocation
 */

/**
 * @swagger
 * /machines/{id}/assign:
 *   get:
 *     summary: Get Current Machine Assignment Details
 *     description: Fetch Operator, Artisan, and Supervisor assignment metadata for a machine.
 *     tags: [Machine Assignment & Fleet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: 'm1-global-777' }
 *         description: Machine ID or Serial Number
 *     responses:
 *       200:
 *         description: Machine assignment details fetched successfully
 *   post:
 *     summary: Assign Operator / Artisan to Machine
 *     description: Supervised machine assignment binding Operator and Artisan to a machine.
 *     tags: [Machine Assignment & Fleet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: 'm1-global-777' }
 *         description: Machine ID to assign
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               operatorId: { type: string, example: 'usr-op-101', description: 'Assigned Operator User ID' }
 *               operatorName: { type: string, example: 'Alex Operator' }
 *               artisanId: { type: string, example: 'usr-art-202', description: 'Assigned Artisan User ID' }
 *               artisanName: { type: string, example: 'John Artisan' }
 *     responses:
 *       200:
 *         description: Machine assigned successfully
 *   delete:
 *     summary: Unassign Machine from Operator & Artisan
 *     description: Clears Operator and Artisan assignments from the machine and moves it to the unassigned fleet.
 *     tags: [Machine Assignment & Fleet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: 'm1-global-777' }
 *         description: Machine ID or Serial Number to unassign
 *     responses:
 *       200:
 *         description: Machine unassigned successfully
 */

/**
 * @swagger
 * /machines/{id}/manual-data:
 *   post:
 *     summary: Submit Component Inspection Readings
 *     description: Submit component parameters, calculate real-time health score, and record audit log in PostgreSQL.
 *     tags: [Machine Inspection & Health Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: 'heh-cat-777' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [componentName, parameters]
 *             properties:
 *               componentName: { type: string, example: 'Main Engine Assembly' }
 *               parameters:
 *                 type: object
 *                 example: { "Oil Pressure": 4.2, "Coolant Temperature": 88 }
 *     responses:
 *       200:
 *         description: Inspection saved and health score calculated
 *   get:
 *     summary: Get Latest Inspection Data by Machine ID
 *     tags: [Machine Inspection & Health Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Latest component health and inspection parameters
 *
 * /machines/{id}/inspection-history:
 *   get:
 *     summary: Get Machine Inspection History Audit Trail
 *     tags: [Machine Inspection & Health Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Chronological audit trail logs for machine inspections
 */

/**
 * @swagger
 * /machines/{id}:
 *   get:
 *     summary: Get machine by ID
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: 'm1-global-777' }
 *     responses:
 *       200:
 *         description: Machine details with components and health metrics
 *   put:
 *     summary: Update an existing machine
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               manufacturer: { type: string }
 *               model: { type: string }
 *               site: { type: string }
 *     responses:
 *       200:
 *         description: Machine updated successfully
 *   delete:
 *     summary: Delete a machine
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Machine deleted successfully
 */
