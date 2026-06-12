/**
 * @swagger
 * tags:
 *   name: Component Intelligence
 *   description: Calculation Engine and Risk Assessment Reports
 */

/**
 * @swagger
 * /intelligence/register:
 *   get:
 *     summary: Get component register with calculated metrics
 *     description: |
 *       Returns all components for a company with high-precision lifecycle
 *       calculations including hours run, life used %, remaining hours,
 *       risk status, risk color, and estimated cost savings.
 *     tags: [Component Intelligence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema: { type: string }
 *         description: UUID of the company
 *     responses:
 *       200:
 *         description: List of components processed by the Intelligence Engine
 *       400:
 *         description: Bad request or missing companyId
 */

/**
 * @swagger
 * /intelligence/dashboard-stats:
 *   get:
 *     summary: Get high-level risk and cost analytics
 *     description: Returns aggregated dashboard statistics for the company.
 *     tags: [Component Intelligence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema: { type: string }
 *         description: UUID of the company
 *     responses:
 *       200:
 *         description: Dashboard summary stats
 *       400:
 *         description: Bad request or missing companyId
 */

