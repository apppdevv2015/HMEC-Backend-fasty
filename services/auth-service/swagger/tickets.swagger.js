/**
 * @swagger
 * tags:
 *   - name: Tickets
 *     description: Support Ticket & Helpdesk System Management
 */

/**
 * @swagger
 * /auth/tickets:
 *   get:
 *     summary: Get tickets list with filters & pagination
 *     tags: [Tickets]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Open, Assigned, In Progress, Waiting for Customer, Resolved, Closed]
 *         description: Filter by ticket status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [Low, Medium, High, Urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by ticket number, subject, or description
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Tickets list fetched successfully
 *   post:
 *     summary: Create a new support ticket
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - description
 *             properties:
 *               subject:
 *                 type: string
 *                 example: "Machine #4 display not turning on"
 *               description:
 *                 type: string
 *                 example: "The main touchscreen panel stopped responding after restart."
 *               category:
 *                 type: string
 *                 example: "General"
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High, Urgent]
 *                 example: "Medium"
 *               companyId:
 *                 type: string
 *                 description: "Optional company ID (if user is linked to a company)"
 *     responses:
 *       201:
 *         description: Ticket created successfully
 *       400:
 *         description: Bad request (Missing companyId or required fields)
 */

/**
 * @swagger
 * /auth/tickets/{id}:
 *   get:
 *     summary: Get detailed ticket information by ID
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket UUID
 *     responses:
 *       200:
 *         description: Ticket details fetched successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Ticket not found
 */

/**
 * @swagger
 * /auth/tickets/{id}/messages:
 *   post:
 *     summary: Add a message/reply to a ticket
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Checked power source, awaiting technician arrival."
 *     responses:
 *       201:
 *         description: Message added successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /auth/tickets/{id}/status:
 *   patch:
 *     summary: Update status of a ticket
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Open, Assigned, In Progress, Waiting for Customer, Resolved, Closed]
 *                 example: "In Progress"
 *     responses:
 *       200:
 *         description: Ticket status updated successfully
 *       400:
 *         description: Invalid status value
 */

/**
 * @swagger
 * /auth/tickets/{id}/assign:
 *   patch:
 *     summary: Assign ticket to a support staff / technician
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assignedToId:
 *                 type: string
 *                 description: ID of user to assign ticket to
 *     responses:
 *       200:
 *         description: Ticket assigned successfully
 *       500:
 *         description: Internal server error
 */
