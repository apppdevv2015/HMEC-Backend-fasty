/**
 * @swagger
 * tags:
 *   name: Components
 *   description: Component lifecycle and monitoring
 */

/**
 * @swagger
 * /components/categories:
 *   get:
 *     summary: Get all component categories (for dropdowns)
 *     tags: [Components]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   name: { type: string, example: 'Tyre' }
 *                   description: { type: string }
 */

/**
 * @swagger
 * /components:
 *   post:
 *     summary: Register a new component
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
 *               machineId: { type: string }
 *               category: { type: string, example: 'Tyre' }
 *               description: { type: string, example: 'Front Left Tyre' }
 *               serialNumber: { type: string, example: 'TY-990-001' }
 *               supplier: { type: string, example: 'CK & IJ Group' }
 *               installHours: { type: number, example: 800 }
 *               currentHours: { type: number, example: 4900 }
 *               plannedLife: { type: number, example: 8000 }
 *               replacementCost: { type: number, example: 14200 }
 *               condition: { type: number, example: 3 }
 *     responses:
 *       201:
 *         description: Component registered successfully
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
 *               category: { type: string, example: 'Tyre' }
 *               description: { type: string, example: 'Front Left Tyre' }
 *               serialNumber: { type: string, example: 'TY-990-001' }
 *               supplier: { type: string, example: 'CK & IJ Group' }
 *               installHours: { type: number, example: 800 }
 *               currentHours: { type: number, example: 4900 }
 *               plannedLife: { type: number, example: 8000 }
 *               replacementCost: { type: number, example: 14200 }
 *               condition: { type: number, example: 3 }
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
 */

/**
 * @swagger
 * /components/register:
 *   get:
 *     summary: Get component register (table view) with intelligence metrics
 *     tags: [Components]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of components with calculated metrics
 */

/**
 * @swagger
 * /components/dashboard-stats:
 *   get:
 *     summary: Get component dashboard stats (for cards)
 *     tags: [Components]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Dashboard summary statistics
 */
