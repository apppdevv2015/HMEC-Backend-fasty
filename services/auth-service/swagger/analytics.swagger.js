/**
 * @swagger
 * tags:
 *   - name: graph_analytic
 *     description: Dashboard charts, graphs, and performance metrics
 */

/**
 * @swagger
 * /auth/company/dashboard/sales-trends:
 *   get:
 *     summary: Get Sales Trends Candlestick Data (Analytics)
 *     description: Returns historical sales metrics in Highcharts-compatible OHLC (Open, High, Low, Close) candlestick format.
 *     tags: [graph_analytic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: daily
 *         description: Time interval configuration for grouping sales trend metrics
 *     responses:
 *       200:
 *         description: Historical sales candlestick data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Request processed successfully" }
 *                 data:
 *                   type: array
 *                   description: Array of candlestick points [timestamp, open, high, low, close]
 *                   items:
 *                     type: array
 *                     items:
 *                       type: number
 *                     example: [1783508104000, 375.25, 378.10, 373.40, 376.50]
 *                 error: { type: string, nullable: true, example: null }
 *                 timestamp: { type: string, example: "2026-07-08T11:08:07Z" }
 *       401:
 *         description: Unauthorized. Invalid or missing authentication token.
 *       403:
 *         description: Forbidden. Insufficient user permissions.
 */
