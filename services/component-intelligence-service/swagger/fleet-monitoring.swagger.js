/**
 * @swagger
 * /intelligence/fleet-monitoring:
 *   get:
 *     summary: Get Fleet Health Monitoring Data
 *     description: |
 *       Returns a complete fleet health monitoring breakdown for the given company.
 *       Includes overall stats (Total, Healthy, Warning, Critical, Offline, Average Fleet Health),
 *       tabs by equipment categories, and detailed per-machine rows.
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
 *         description: Fleet monitoring data with stats, categories, summary cards, and per-machine breakdown
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
 *                   example: Fleet monitoring data fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalMachines:
 *                           type: integer
 *                           example: 8
 *                         critical:
 *                           type: integer
 *                           example: 1
 *                         warning:
 *                           type: integer
 *                           example: 2
 *                         healthy:
 *                           type: integer
 *                           example: 5
 *                         offline:
 *                           type: integer
 *                           example: 0
 *                         averageFleetHealth:
 *                           type: integer
 *                           example: 88
 *                     categories:
 *                       type: array
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
 *                           offline:
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
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: CK&IJ-785-011
 *                           dbId:
 *                             type: string
 *                             example: 4a2d8d8e-7e9b-4e1c-bb78-0f73f5ff2f44
 *                           name:
 *                             type: string
 *                             example: CK&IJ-785-011
 *                           model:
 *                             type: string
 *                             example: 785C
 *                           location:
 *                             type: string
 *                             example: North Pit
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
 *                             type: object
 *                             properties:
 *                               status:
 *                                 type: string
 *                                 example: ok
 *                               health:
 *                                 type: integer
 *                                 example: 90
 *                           engine:
 *                             type: object
 *                             properties:
 *                               status:
 *                                 type: string
 *                                 example: warn
 *                               health:
 *                                 type: integer
 *                                 example: 65
 *                           hydraulic:
 *                             type: object
 *                             properties:
 *                               status:
 *                                 type: string
 *                                 example: ok
 *                               health:
 *                                 type: integer
 *                                 example: 85
 *                           transmission:
 *                             type: object
 *                             properties:
 *                               status:
 *                                 type: string
 *                                 example: ok
 *                               health:
 *                                 type: integer
 *                                 example: 92
 *                           risk:
 *                             type: string
 *                             example: Warning
 *                           status:
 *                             type: string
 *                             example: Warning
 *                           healthPercent:
 *                             type: integer
 *                             example: 83
 *                           hoursRun:
 *                             type: integer
 *                             example: 1250
 *       400:
 *         description: Bad request or missing companyId
 */
