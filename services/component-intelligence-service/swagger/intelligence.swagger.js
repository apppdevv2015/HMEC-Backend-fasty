/**
 * @swagger
 * tags:
 *   name: Component Intelligence
 *   description: Calculation Engine and Risk Assessment Reports
 */

/**
 * @swagger
 * /components/register:
 *   get:
 *     summary: Get component register with calculated metrics
 *     tags: [Component Intelligence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of components processed by the Intelligence Engine
 */

/**
 * @swagger
 * /components/dashboard-stats:
 *   get:
 *     summary: Get high-level risk and cost analytics
 *     tags: [Component Intelligence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Dashboard summary stats
 */
