/**
 * @swagger
 * tags:
 *   name: Quotation Plans
 *   description: Master Pricing Tiers & Subscription Packages Catalog (Free Trial, Up to 10 machines: R25k, 11-25: R45k, 26-75: R95k, 76-150: R150k, 151+: Custom)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     QuotationPlan:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 'c6b8c4d2-7e56-47a8-936d-17e923e42101'
 *         name:
 *           type: string
 *           example: '11 – 25 Machines'
 *         tierCode:
 *           type: string
 *           example: 'TIER_2'
 *         minMachines:
 *           type: integer
 *           example: 11
 *         maxMachines:
 *           type: integer
 *           example: 25
 *         monthlyPrice:
 *           type: number
 *           example: 45000
 *         currency:
 *           type: string
 *           example: 'ZAR'
 *         durationOptions:
 *           type: array
 *           items:
 *             type: integer
 *           example: [1, 3, 6, 12, 24]
 *         isTrial:
 *           type: boolean
 *           example: false
 *         trialDays:
 *           type: integer
 *           example: 14
 *         isCustom:
 *           type: boolean
 *           example: false
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - '11 to 25 Active Mining Machines'
 *             - 'Real-time Fleet Health Heatmap'
 *             - 'Priority Support (SLA: 8h)'
 *         sortOrder:
 *           type: integer
 *           example: 3
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     QuotationPlanInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: 'Tier 2: Growth Fleet (11-25 Machines)'
 *         tierCode:
 *           type: string
 *           example: 'TIER_2'
 *         minMachines:
 *           type: integer
 *           example: 11
 *         maxMachines:
 *           type: integer
 *           example: 25
 *         monthlyPrice:
 *           type: number
 *           example: 45000
 *         currency:
 *           type: string
 *           example: 'ZAR'
 *         durationOptions:
 *           type: array
 *           items:
 *             type: integer
 *           example: [1, 3, 6, 12, 24]
 *         isTrial:
 *           type: boolean
 *           example: false
 *         trialDays:
 *           type: integer
 *           example: 14
 *         isCustom:
 *           type: boolean
 *           example: false
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - '11 to 25 Active Mining Machines'
 *             - 'Priority Support (SLA: 8h)'
 *         sortOrder:
 *           type: integer
 *           example: 3
 *         isActive:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /quotation-plans:
 *   get:
 *     summary: List active quotation pricing plans (Public)
 *     description: Retrieve all active standard pricing tiers (Free Trial, R25k, R45k, R95k, R150k, Custom) for quotation builder dropdowns.
 *     tags: [Quotation Plans]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by plan name or tierCode
 *     responses:
 *       200:
 *         description: List of active quotation plans
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
 *                   example: Active quotation plans fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QuotationPlan'
 *
 *   post:
 *     summary: Super Admin - Create new quotation pricing tier
 *     tags: [Quotation Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuotationPlanInput'
 *     responses:
 *       201:
 *         description: Quotation pricing plan created successfully
 *
 * /quotation-plans/admin:
 *   get:
 *     summary: Super Admin - List all quotation pricing tiers (Active + Inactive)
 *     tags: [Quotation Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: All master quotation plans list
 *
 * /quotation-plans/{id}:
 *   get:
 *     summary: Get single quotation plan details by ID
 *     tags: [Quotation Plans]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quotation plan details
 *
 *   put:
 *     summary: Super Admin - Update an existing quotation plan
 *     tags: [Quotation Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuotationPlanInput'
 *     responses:
 *       200:
 *         description: Quotation pricing plan updated successfully
 *
 *   delete:
 *     summary: Super Admin - Delete a quotation plan
 *     tags: [Quotation Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quotation plan deleted successfully
 *
 * /quotation-plans/{id}/toggle:
 *   patch:
 *     summary: Super Admin - Toggle active/inactive status of a quotation plan
 *     tags: [Quotation Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan status updated successfully
 */
