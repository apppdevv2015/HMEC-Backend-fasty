/**
 * @swagger
 * tags:
 *   - name: Component Category Create
 *     description: Component Category creation and management
 *   - name: Components
 *     description: Component lifecycle and monitoring
 */

/**
 * @swagger
 * /components/categories:
 *   post:
 *     summary: Create a Component Category
 *     description: Company Admin token automatically binds companyId. companyId in request body is optional.
 *     tags: [Component Category Create]
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
 *               name: { type: string, example: 'Engine Assembly' }
 *               description: { type: string, example: 'High-horsepower mining diesel engine block & turbochargers' }
 *               companyId: { type: string, example: 'COMP-101', description: 'Optional. Auto-filled from JWT token if omitted.' }
 *     responses:
 *       201:
 *         description: Component Category created successfully
 *   get:
 *     summary: Get all Component Categories
 *     tags: [Component Category Create]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of Component Categories
 *
 * /components/categories/{id}:
 *   put:
 *     summary: Update an existing Component Category (Edit)
 *     tags: [Component Category Create]
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
 *               name: { type: string, example: 'Engine Assembly Updated' }
 *               description: { type: string, example: 'Updated category description' }
 *     responses:
 *       200:
 *         description: Component Category updated successfully
 *   delete:
 *     summary: Delete a Component Category
 *     tags: [Component Category Create]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Component Category deleted successfully
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
 */
