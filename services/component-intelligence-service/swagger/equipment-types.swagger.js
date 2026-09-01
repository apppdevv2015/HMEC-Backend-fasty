/**
 * @swagger
 * tags:
 *   name: Equipment Types
 *   description: Heavy Mining Equipment (HME) Master Catalog Categories & Equipment Types
 */

/**
 * @swagger
 * /equipment-types:
 *   get:
 *     summary: Get All Equipment Types from Master Catalog
 *     description: Retrieve a clean list of all heavy equipment types (e.g. Haul Truck, Hydraulic Excavator, Wheel Loader, Crane, Dozer) for dropdowns and machine registration.
 *     tags: [Equipment Types]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search/filter equipment types by keyword (e.g. crane, truck)
 *     responses:
 *       200:
 *         description: List of equipment types fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Equipment types fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "All Terrain Crane"
 *                     - "Articulated Dump Truck"
 *                     - "Backhoe Loader"
 *                     - "Crawler Crane"
 *                     - "Hydraulic Excavator"
 *                     - "Mining Haul Truck"
 *                     - "Motor Grader"
 *                     - "Wheel Loader"
 */
