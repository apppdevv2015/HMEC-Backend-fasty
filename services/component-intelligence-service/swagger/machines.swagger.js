/**
 * @swagger
 * tags:
 *   name: Machines
 *   description: Machine and equipment management
 */

/**
 * @swagger
 * /machines:
 *   post:
 *     summary: Register a new machine
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, model, serialNumber, companyId]
 *             properties:
 *               name: { type: string, example: 'CK&IJ-990-020' }
 *               model: { type: string, example: '990H' }
 *               serialNumber: { type: string, example: 'SN-12345' }
 *               equipmentType: { type: string, example: 'FEL' }
 *               companyId: { type: string }
 *     responses:
 *       201:
 *         description: Machine registered successfully
 */

/**
 * @swagger
 * /machines:
 *   get:
 *     summary: Get all machines for a company
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
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
 *               name: { type: string, example: 'CK&IJ-990-020' }
 *               model: { type: string, example: '990H' }
 *               serialNumber: { type: string, example: 'SN-12345' }
 *               equipmentType: { type: string, example: 'FEL' }
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
 *     summary: Get ALL Assigned Machines List for Company
 *     description: Fetch a list of all assigned machines with active Operator, Artisan, Supervisor details and assignment timestamps.
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
 *         description: List of all assigned machines fetched successfully
 */

/**
 * @swagger
 * /machines/{id}/assign:
 *   post:
 *     summary: Assign Machine by Machine ID
 *     description: Assign Operator and Artisan to machine ID in URL. Backend auto-resolves User Names from DB and binds logged-in Supervisor & Company ID.
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Machine ID to assign
 *         schema: { type: string, example: 'm_1' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: string, example: 'usr_101', description: 'User ID to assign to the machine' }
 *     responses:
 *       200:
 *         description: Machine assigned successfully (returns machineId, machineName, operatorName, artisanName, supervisorName, companyId, assignedAt)
 *       403:
 *         description: Access denied. Operators and Artisans cannot assign machines. Only Supervisors, Admins, or Managers are authorized.
 *   get:
 *     summary: Get Machine Assignment Details by Machine ID
 *     description: Fetch active assignment details (Operator, Artisan, Supervisor, Company ID, assignedAt) for a specific machine.
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
