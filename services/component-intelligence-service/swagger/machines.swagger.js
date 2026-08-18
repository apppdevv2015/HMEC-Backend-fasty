/**
 * @swagger
 * tags:
 *   - name: Machine Category Create
 *     description: Machine Equipment Type Categories creation and management
 *   - name: Component Category Create
 *     description: Component Category creation and management
 *   - name: Machines
 *     description: Machine and equipment management
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
 *             required: [name, model, serialNumber]
 *             properties:
 *               name: { type: string, example: 'HT-401' }
 *               model: { type: string, example: 'CAT 797F' }
 *               serialNumber: { type: string, example: 'SN-797F-001' }
 *               equipmentType: { type: string, example: 'Haul Truck 400T' }
 *               companyId: { type: string, example: 'COMP-101', description: 'Optional. Auto-filled from JWT token if omitted.' }
 *     responses:
 *       201:
 *         description: Machine registered successfully
 *   get:
 *     summary: Get all machines for a company
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: false
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of machines
 */

/**
 * @swagger
 * /machines/{id}:
 *   put:
 *     summary: Update an existing machine (Edit)
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
 *               name: { type: string, example: 'HT-401' }
 *               model: { type: string, example: 'CAT 797F' }
 *               serialNumber: { type: string, example: 'SN-797F-001' }
 *               equipmentType: { type: string, example: 'Haul Truck 400T' }
 *     responses:
 *       200:
 *         description: Machine updated successfully
 *   delete:
 *     summary: Delete an existing machine
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

/**
 * @swagger
 * /machines/assignments:
 *   get:
 *     summary: Get ALL Assigned Machines List for Company (supports ?operatorId=...)
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: operatorId
 *         required: false
 *         schema: { type: string }
 *         description: Filter assignments by Operator ID
 *     responses:
 *       200:
 *         description: List of all assigned machines
 */

/**
 * @swagger
 * /machines/operator-assignments:
 *   get:
 *     summary: Get Operator Assigned Machines and Assignment History
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operator active assigned machines and full assignment history
 */

/**
 * @swagger
 * /machines/operator/{operatorId}/assignments:
 *   get:
 *     summary: Get Specific Operator Assignment History by Operator ID
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operatorId
 *         required: true
 *         schema: { type: string }
 *         description: Operator User ID
 *     responses:
 *       200:
 *         description: Specific operator active machines and full history
 */

/**
 * @swagger
 * /machines/{id}/assign:
 *   post:
 *     summary: Assign Machine by Machine ID
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: 'm_1' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: string, example: 'usr_101' }
 *     responses:
 *       200:
 *         description: Machine assigned successfully
 *   get:
 *     summary: Get Machine Assignment Details by Machine ID
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: 'm_1' }
 *     responses:
 *       200:
 *         description: Machine assignment details fetched successfully
 */
