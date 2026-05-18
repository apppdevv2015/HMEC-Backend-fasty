/**
 * @swagger
 * tags:
 *   name: Machines
 *   description: Machine and equipment management
 */

/**
 * @swagger
 * /api/v1/machines:
 *   post:
 *     summary: Register a new machine
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, model, serialNumber, companyId]
 *             properties:
 *               name: { type: string, example: 'CK&IJ-990-020' }
 *               model: { type: string, example: '990H' }
 *               serialNumber: { type: string, example: 'SN-12345' }
 *               equipmentType: { type: string, example: 'FEL' }
 *               companyId: { type: string }
 *     responses:
 *       201:
 *         description: Machine registered successfully
 */

/**
 * @swagger
 * /api/v1/machines:
 *   get:
 *     summary: Get all machines for a company
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of machines
 */
