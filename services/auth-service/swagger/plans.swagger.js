/**
 * @swagger
 * tags:
 *   - name: Plans
 *     description: Subscription Plans and Payments
 */

/**
 * @swagger
 * /plans:
 *   get:
 *     summary: Get all subscription plans (Public)
 *     tags: [Plans]
 *     security: []
 *     responses:
 *       200:
 *         description: List of plans
 *   post:
 *     summary: Create a new Plan (Super Admin Only)
 *     tags: [Plans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               price: { type: number }
 *               machineLimit: { type: integer }
 *               staffLimit: { type: integer }
 *               validityDays: { type: integer }
 *     responses:
 *       201:
 *         description: Plan created
 */

/**
 * @swagger
 * /plans/{id}:
 *   put:
 *     summary: Update a Plan (Super Admin Only)
 *     tags: [Plans]
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
 *             type: object
 *             properties:
 *               name: { type: string }
 *               price: { type: number }
 *     responses:
 *       200:
 *         description: Plan updated
 *   delete:
 *     summary: Delete a Plan (Super Admin Only)
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan deleted
 */

/**
 * @swagger
 * /plans/active:
 *   get:
 *     summary: Get current active plan for logged-in company
 *     tags: [Plans]
 *     responses:
 *       200:
 *         description: Active plan details
 */

/**
 * @swagger
 * /plans/admin/subscriptions:
 *   get:
 *     summary: List all company subscriptions (Super Admin & Sub Super Admin Only)
 *     tags: [Plans]
 *     responses:
 *       200:
 *         description: All subscriptions list
 */

/**
 * @swagger
 * /plans/checkout:
 *   post:
 *     summary: Initiate PayFast Checkout
 *     tags: [Plans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan_id: { type: string }
 *     responses:
 *       200:
 *         description: Payment URL generated
 */
