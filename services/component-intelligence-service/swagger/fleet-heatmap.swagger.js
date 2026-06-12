/**
 * @swagger
 * tags:
 *   name: Fleet Heat Map
 *   description: Fleet-wide health visualization — machine-by-machine status across Tyre, Engine, Hydraulic & Transmission systems
 */

/**
 * @swagger
 * /intelligence/fleet-heatmap:
 *   get:
 *     summary: Get Fleet Health Heat Map
 *     description: |
 *       Returns a complete fleet health heatmap for the given company.
 *       Each machine is analyzed across 4 system slots (Tyre, Engine, Hydraulic, Transmission).
 *       The worst-performing component per slot is selected for display.
 *       
 *       **Flow:**
 *       1. Fetches all machines and their components for the company from DB
 *       2. Classifies each machine into equipment types (Dozer, Drill, Excavator, HT, Grader)
 *       3. For each machine, categorizes components into 4 system slots
 *       4. Runs high-precision lifecycle calculations (hours run, % life used, risk status)
 *       5. Picks the worst-case component per slot (lowest life left)
 *       6. Calculates overall machine risk (Critical > Warning > Healthy)
 *       7. Aggregates fleet-wide stats, category tabs, and summary cards
 *     tags: [Fleet Heat Map]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the company to fetch fleet data for
 *     responses:
 *       200:
 *         description: Fleet heatmap data with stats, categories, summary cards, and per-machine breakdown
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
 *                   example: Fleet heatmap data fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       description: Fleet-wide summary counters
 *                       properties:
 *                         totalMachines:
 *                           type: integer
 *                           example: 8
 *                         critical:
 *                           type: integer
 *                           example: 5
 *                         warning:
 *                           type: integer
 *                           example: 2
 *                         healthy:
 *                           type: integer
 *                           example: 1
 *                     categories:
 *                       type: array
 *                       description: Equipment type tabs with counts
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: All Equipment
 *                           count:
 *                             type: integer
 *                             example: 8
 *                           active:
 *                             type: boolean
 *                             example: true
 *                     summaryCards:
 *                       type: array
 *                       description: Per-equipment-type breakdown cards
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             example: DOZER
 *                           name:
 *                             type: string
 *                             example: Dozers
 *                           total:
 *                             type: integer
 *                             example: 2
 *                           crit:
 *                             type: integer
 *                             example: 1
 *                           warn:
 *                             type: integer
 *                             example: 1
 *                           ok:
 *                             type: integer
 *                             example: 0
 *                           color:
 *                             type: string
 *                             example: text-orange-500
 *                           bg:
 *                             type: string
 *                             example: bg-orange-50/50
 *                     fleetData:
 *                       type: array
 *                       description: Per-machine heatmap rows
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: CK&IJ-785-011
 *                           location:
 *                             type: string
 *                             example: Main Mine Site
 *                           fleet:
 *                             type: string
 *                             example: PLT-032
 *                           type:
 *                             type: string
 *                             example: HT
 *                           rawType:
 *                             type: string
 *                             example: HT
 *                           tyre:
 *                             $ref: '#/components/schemas/HeatMapSlot'
 *                           engine:
 *                             $ref: '#/components/schemas/HeatMapSlot'
 *                           hydraulic:
 *                             $ref: '#/components/schemas/HeatMapSlot'
 *                           transmission:
 *                             $ref: '#/components/schemas/HeatMapSlot'
 *                           risk:
 *                             type: string
 *                             enum: [Critical, Warning, Healthy]
 *                             example: Critical
 *       400:
 *         description: Bad request or missing companyId
 */

/**
 * @swagger
 * /intelligence/fleet-heatmap:
 *   post:
 *     summary: Register a new machine in the fleet
 *     description: Registers a new machine for the logged-in user's company and initializes it.
 *     tags: [Fleet Heat Map]
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
 *               name:
 *                 type: string
 *                 example: CK&IJ-990-020
 *                 description: Descriptive name of the machine
 *               model:
 *                 type: string
 *                 example: 990H
 *                 description: Machine model (used to classify equipment type)
 *               serialNumber:
 *                 type: string
 *                 example: SN-12345
 *                 description: Unique serial number of the machine
 *               site:
 *                 type: string
 *                 example: North Pit
 *                 description: Site or location where the machine is deployed
 *               costPerHourTarget:
 *                 type: number
 *                 example: 120.50
 *                 description: Cost per hour target
 *               costPerTonTarget:
 *                 type: number
 *                 example: 1.25
 *                 description: Cost per ton target
 *     responses:
 *       201:
 *         description: Machine registered successfully in the fleet
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
 *                   example: Machine registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 4a2d8d8e-7e9b-4e1c-bb78-0f73f5ff2f44
 *                     name:
 *                       type: string
 *                       example: CK&IJ-990-020
 *                     model:
 *                       type: string
 *                       example: 990H
 *                     serialNumber:
 *                       type: string
 *                       example: SN-12345
 *                     equipmentType:
 *                       type: string
 *                       example: N/A
 *       400:
 *         description: Bad request, validation failure, or subscription limits reached
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /intelligence/fleet-heatmap/{id}:
 *   put:
 *     summary: Update an existing machine in the fleet
 *     description: Updates the configuration or targets of a machine by its ID.
 *     tags: [Fleet Heat Map]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the machine to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: CK&IJ-990-020-Updated
 *               model:
 *                 type: string
 *                 example: 990H
 *               serialNumber:
 *                 type: string
 *                 example: SN-12345-RevA
 *               site:
 *                 type: string
 *                 example: South Pit
 *               costPerHourTarget:
 *                 type: number
 *                 example: 130.00
 *               costPerTonTarget:
 *                 type: number
 *                 example: 1.45
 *     responses:
 *       200:
 *         description: Machine updated successfully
 *       400:
 *         description: Validation failed or database update error
 *       401:
 *         description: Unauthorized
 * 
 *   delete:
 *     summary: Delete a machine from the fleet
 *     description: Permanently removes a machine from the database.
 *     tags: [Fleet Heat Map]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the machine to delete
 *     responses:
 *       200:
 *         description: Machine deleted successfully
 *       400:
 *         description: Database error or item not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     HeatMapSlot:
 *       type: object
 *       description: Worst-case component status for a system slot on a machine
 *       properties:
 *         status:
 *           type: string
 *           enum: [crit, warn, ok, none]
 *           example: crit
 *           description: "crit=Critical, warn=Warning, ok=Healthy, none=No data"
 *         label:
 *           type: string
 *           example: LEFT REAR TYRE
 *           description: Name of the worst-performing component in this slot
 *         life:
 *           type: string
 *           example: 13% life left
 *           description: Remaining life percentage as display text
 */

