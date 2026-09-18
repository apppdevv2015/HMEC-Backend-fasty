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
 */

/**
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
/**
 * @swagger
 * /components/engineer-dashboard:
 *   get:
 *     summary: Get components for Engineer Dashboard
 *     description: Retrieves all components associated with the authenticated user's company for the Engineer Dashboard, including component health intelligence and machine information.
 *     tags: [Components]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Engineer dashboard components fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Engineer dashboard components fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: comp_001
 *                       name:
 *                         type: string
 *                         nullable: true
 *                         example: Engine Assembly
 *                       machineId:
 *                         type: string
 *                         example: machine_001
 *                       companyId:
 *                         type: string
 *                         nullable: true
 *                         example: company_001
 *                       category:
 *                         type: string
 *                         nullable: true
 *                         example: Engine
 *                       componentType:
 *                         type: string
 *                         nullable: true
 *                         example: Diesel Engine
 *                       description:
 *                         type: string
 *                         nullable: true
 *                         example: CAT C175-20 Diesel Engine
 *                       serialNumber:
 *                         type: string
 *                         nullable: true
 *                         example: ENG-797F-001
 *                       installHours:
 *                         type: number
 *                         example: 0
 *                       currentHours:
 *                         type: number
 *                         example: 1200
 *                       plannedLife:
 *                         type: number
 *                         example: 18000
 *                       replacementCost:
 *                         type: string
 *                         example: "350000"
 *                       condition:
 *                         type: number
 *                         example: 1
 *                       machine:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: machine_001
 *                           name:
 *                             type: string
 *                             nullable: true
 *                             example: CAT 797F
 *                           manufacturer:
 *                             type: string
 *                             nullable: true
 *                             example: Caterpillar
 *                           model:
 *                             type: string
 *                             nullable: true
 *                             example: 797F
 *                           serialNumber:
 *                             type: string
 *                             nullable: true
 *                             example: CAT-797F-001
 *                           equipmentType:
 *                             type: string
 *                             nullable: true
 *                             example: Mining Truck
 *                       intelligence:
 *                         type: object
 *                         properties:
 *                           hoursRun:
 *                             type: number
 *                             example: 1200
 *                           lifeUsedPercent:
 *                             type: number
 *                             example: 6.67
 *                           remainingHours:
 *                             type: number
 *                             example: 16800
 *                           riskStatus:
 *                             type: string
 *                             example: Healthy
 *                           riskColor:
 *                             type: string
 *                             example: green
 *                           riskDriver:
 *                             type: string
 *                             example: Normal operating hours
 *                           estimatedSavings:
 *                             type: string
 *                             example: "$25000"
 *       400:
 *         description: Company ID is missing or request is invalid
 *       401:
 *         description: Unauthorized - authentication token is missing or invalid
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * tags:
 *   - name: Live Alerts
 *     description: Real-time machine health alerts (Critical/Warning), scoped by company and machine assignment
 */

/**
 * @swagger
 * /alerts:
 *   get:
 *     summary: List Alerts
 *     description: Get live alerts filtered by company and machine access — company-wide roles (super_admin, sub_super_admin, admin) see all company alerts; operators/artisans/supervisors see only alerts for machines assigned to them.
 *     tags: [Live Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *     responses:
 *       200:
 *         description: Alerts fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Alerts fetched successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     page: { type: integer, example: 1 }
 *                     limit: { type: integer, example: 20 }
 *                     totalItems: { type: integer, example: 3 }
 *                     totalPages: { type: integer, example: 1 }
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string, example: alert_001 }
 *                           companyId: { type: string }
 *                           machineId: { type: string }
 *                           componentName: { type: string, example: Main Hydraulic System }
 *                           parameterName: { type: string, nullable: true, example: Hydraulic Pressure }
 *                           previousHealth: { type: integer, example: 80 }
 *                           currentHealth: { type: integer, example: 62 }
 *                           healthDrop: { type: integer, example: 18 }
 *                           status: { type: string, example: Warning }
 *                           message: { type: string }
 *                           isRead: { type: boolean, example: false }
 *                           createdAt: { type: string, format: date-time }
 *                           machine:
 *                             type: object
 *                             properties:
 *                               name: { type: string }
 *                               model: { type: string }
 *                               serialNumber: { type: string }
 *       400:
 *         description: Company context missing
 */
/**
 * @swagger
 * /alerts/{id}:
 *   get:
 *     summary: Get Alert by ID
 *     description: Get full detail of a single alert by ID. Access denied if the alert's machine isn't assigned to the requesting user (unless company-wide role).
 *     tags: [Live Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Alert fetched successfully
 *       404:
 *         description: Alert not found
 *       403:
 *         description: Access denied — alert does not belong to your company or assigned machine
 *   delete:
 *     summary: Delete Alert
 *     description: Delete an alert record. Same access rules as GET by ID.
 *     tags: [Live Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Alert deleted successfully
 *       404:
 *         description: Alert not found
 *       403:
 *         description: Access denied
 */
