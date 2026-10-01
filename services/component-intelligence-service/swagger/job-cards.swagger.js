/**
 * @swagger
 * tags:
 *   name: Job Cards
 *   description: Digital Job Card / Work Order Management Module
 */

/**
 * @swagger
 * /job-cards:
 *   post:
 *     summary: Create a new Job Card
 *     tags: [Job Cards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [machineId, title]
 *             properties:
 *               machineId: { type: string }
 *               componentId: { type: string }
 *               title: { type: string, example: 'Engine overhaul' }
 *               description: { type: string }
 *               maintenanceType: { type: string, enum: [PREVENTIVE, CORRECTIVE, BREAKDOWN, INSPECTION, REBUILD, COMPONENT_REPLACEMENT] }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH, CRITICAL] }
 *               plannedStartDate: { type: string, format: date }
 *               plannedFinishDate: { type: string, format: date }
 *               assignedTechnicianId: { type: string }
 *               assignedSupervisorId: { type: string }
 *               assignedPlannerId: { type: string }
 *               allocatedLaborHours: { type: number, example: 8 }
 *               laborRate: { type: number, example: 350 }
 *               requiredTools: { type: string }
 *     responses:
 *       201:
 *         description: Job Card created successfully
 *   get:
 *     summary: Get all Job Cards (with filters + summary)
 *     tags: [Job Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: maintenanceType
 *         schema: { type: string }
 *       - in: query
 *         name: priority
 *         schema: { type: string }
 *       - in: query
 *         name: machineId
 *         schema: { type: string }
 *       - in: query
 *         name: componentId
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Job Cards fetched successfully
 */

/**
 * @swagger
 * /job-cards/metrics:
 *   get:
 *     summary: Get Reliability KPIs (MTTR, MTBF, PM Compliance, Downtime, Cost)
 *     tags: [Job Cards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reliability KPIs fetched successfully
 */

/**
 * @swagger
 * /job-cards/dashboard:
 *   get:
 *     summary: Get Job Card dashboard (by machine/component/technician/priority, parts consumption, breakdown trend)
 *     tags: [Job Cards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job Card dashboard fetched successfully
 */

/**
 * @swagger
 * /job-cards/from-alert/{alertId}:
 *   post:
 *     summary: Auto-create a Job Card from a system alert
 *     tags: [Job Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Job Card created from alert
 *       400:
 *         description: Alert not found or duplicate Job Card already exists
 */

/**
 * @swagger
 * /job-cards/{id}:
 *   get:
 *     summary: Get Job Card by ID
 *     tags: [Job Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Job Card fetched successfully
 *       404:
 *         description: Job Card not found
 *   put:
 *     summary: Update Job Card details
 *     tags: [Job Cards]
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
 *               title: { type: string }
 *               description: { type: string }
 *               priority: { type: string }
 *               assignedTechnicianId: { type: string }
 *               assignedSupervisorId: { type: string }
 *               assignedPlannerId: { type: string }
 *               allocatedLaborHours: { type: number }
 *               laborRate: { type: number }
 *     responses:
 *       200:
 *         description: Job Card updated successfully
 */

/**
 * @swagger
 * /job-cards/{id}/status:
 *   patch:
 *     summary: Update Job Card status (lifecycle transitions)
 *     tags: [Job Cards]
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [OPEN, ASSIGNED, IN_PROGRESS, WAITING_FOR_PARTS, WAITING_FOR_APPROVAL, CANCELLED] }
 *               rootCause: { type: string }
 *               correctiveAction: { type: string }
 *               postRepairCondition: { type: integer, example: 1 }
 *               downtimeHours: { type: number, example: 4 }
 *     responses:
 *       200:
 *         description: Job Card status updated successfully
 */

/**
 * @swagger
 * /job-cards/{id}/labor-timer:
 *   post:
 *     summary: Start / Pause / Resume / Finish the work timer
 *     tags: [Job Cards]
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
 *             required: [actionType]
 *             properties:
 *               actionType: { type: string, enum: [START, RESUME, PAUSE, FINISH] }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Labor log recorded successfully
 */

/**
 * @swagger
 * /job-cards/{id}/parts:
 *   post:
 *     summary: Add a part used on the Job Card
 *     tags: [Job Cards]
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
 *             required: [partName, quantity]
 *             properties:
 *               partName: { type: string, example: 'Oil filter' }
 *               partNumber: { type: string }
 *               quantity: { type: integer, example: 2 }
 *               unitCost: { type: number, example: 450 }
 *     responses:
 *       201:
 *         description: Part added to Job Card successfully
 */

/**
 * @swagger
 * /job-cards/{id}/findings:
 *   post:
 *     summary: Record an inspection finding
 *     tags: [Job Cards]
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
 *             required: [parameterName]
 *             properties:
 *               parameterName: { type: string, example: 'Oil pressure' }
 *               measuredValue: { type: string, example: '42' }
 *               unit: { type: string, example: 'psi' }
 *               standardSpec: { type: string, example: '40-60' }
 *               status: { type: string, enum: [PASS, FAIL] }
 *               remarks: { type: string }
 *     responses:
 *       201:
 *         description: Inspection finding recorded
 */

/**
 * @swagger
 * /job-cards/{id}/attachments:
 *   post:
 *     summary: Upload and attach an image (JPG, PNG or WEBP, max 10 MB) to the Job Card
 *     tags: [Job Cards]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               fileType:
 *                 type: string
 *                 enum: [PHOTO_BEFORE, PHOTO_AFTER]
 *     responses:
 *       201:
 *         description: Image uploaded and attached successfully
 *       400:
 *         description: Invalid file type, file too large, or job card not editable
 *       403:
 *         description: Only the assigned artisan or a supervisor/admin can attach files
 */

/**
 * @swagger
 * /job-cards/{id}/attachments/{attachmentId}:
 *   delete:
 *     summary: Delete an attachment from the Job Card
 *     tags: [Job Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Attachment deleted successfully
 *       403:
 *         description: Only the assigned artisan or a supervisor/admin can delete this attachment
 *       404:
 *         description: Attachment not found on this Job Card
 */
/**
 * @swagger
 * /job-cards/{id}/approve:
 *   post:
 *     summary: Supervisor / Engineering approval step (Completes then Closes the Job Card)
 *     tags: [Job Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Job Card approval recorded
 */

/**
 * @swagger
 * /job-cards/audit-logs/stream:
 *   get:
 *     summary: Get live audit log stream across all Job Cards
 *     tags: [Job Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Live audit stream fetched from database
 */

/**
 * @swagger
 * /job-cards/{id}/audit-logs:
 *   post:
 *     summary: Add a manual audit log entry
 *     tags: [Job Cards]
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
 *               action: { type: string }
 *               title: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Audit log saved to database
 *   get:
 *     summary: Get audit trail for a Job Card
 *     tags: [Job Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Audit trail fetched from database
 */
