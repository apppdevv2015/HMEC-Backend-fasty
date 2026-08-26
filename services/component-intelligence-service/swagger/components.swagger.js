/**
 * @swagger
 * tags:
 *   - name: Components
 *     description: Component lifecycle and monitoring
 */

/**
 * @swagger
 * /components:
 *   post:
 *     summary: Register a new component
 *     description: Company Admin token automatically binds companyId. companyId in request body is optional.
 *     tags: [Components]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [machineId, category, description, serialNumber]
 *             properties:
 *               machineId: { type: string, example: 'm_1' }
 *               category: { type: string, example: 'Engine Assembly' }
 *               description: { type: string, example: 'CAT C175-20 Diesel Engine' }
 *               serialNumber: { type: string, example: 'ENG-797F-001' }
 *               supplier: { type: string, example: 'Caterpillar Inc.' }
 *               installHours: { type: number, example: 0 }
 *               currentHours: { type: number, example: 1200 }
 *               plannedLife: { type: number, example: 18000 }
 *               replacementCost: { type: number, example: 350000 }
 *               condition: { type: number, example: 1 }
 *     responses:
 *       201:
 *         description: Component registered successfully
 *   get:
 *     summary: Get all components
 *     tags: [Components]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of components
 */

/**
 * @swagger
 * /components/{id}:
 *   put:
 *     summary: Update an existing component (Edit)
 *     tags: [Components]
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
 *               category: { type: string, example: 'Engine Assembly' }
 *               description: { type: string, example: 'CAT C175-20 Diesel Engine' }
 *               serialNumber: { type: string, example: 'ENG-797F-001' }
 *               supplier: { type: string, example: 'Caterpillar Inc.' }
 *               currentHours: { type: number, example: 1500 }
 *     responses:
 *       200:
 *         description: Component updated successfully
 *   delete:
 *     summary: Delete an existing component
 *     tags: [Components]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Component deleted successfully
 *//**
 * @swagger
 * /components/machine/{machineId}:
 *   get:
 *     summary: Get all registered components by Machine ID
 *     description: Directly retrieves all registered components belonging to a specific machine ID.
 *     tags: [Components]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: machineId
 *         required: true
 *         description: ID of the machine
 *         schema:
 *           type: string
 *           example: 'm_1'
 *     responses:
 *       200:
 *         description: List of components for the specified machine
 *       400:
 *         description: Bad request or invalid Machine ID
 */
