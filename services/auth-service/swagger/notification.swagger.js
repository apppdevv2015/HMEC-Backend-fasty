/**
 * @swagger
 * tags:
 *   - name: notification
 *     description: User and Company Notifications
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get Notifications
 *     description: Returns notifications targeted to the logged-in user — personal (userId match), company+role broadcast notifications, or all Super Admin global notifications.
 *     tags: [notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *         description: Maximum number of notifications to return
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Request processed successfully" }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, example: "13c2175b-55d8-4f84-b40c-7dd243b02fbb" }
 *                       message: { type: string, example: "Quotation #QT-20260915-DNWL has been sent for your review" }
 *                       timestamp: { type: string, example: "2026-09-17T05:12:42.090Z" }
 *                       timeLabel: { type: string, example: "5 min ago" }
 *                       isRead: { type: boolean, example: false }
 *                       type: { type: string, example: "QUOTATION" }
 *                 error: { type: string, nullable: true, example: null }
 *                 timestamp: { type: string, example: "2026-09-17T05:12:42.090Z" }
 *       401:
 *         description: Unauthorized. Invalid or missing authentication token.
 */

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark Notification as Read
 *     description: Marks a single notification as read. User must own the notification (personal match) or be an authorized Super Admin within its scope.
 *     tags: [notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Request processed successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     companyId: { type: string }
 *                     userId: { type: string, nullable: true }
 *                     role: { type: string, nullable: true }
 *                     message: { type: string }
 *                     type: { type: string }
 *                     isRead: { type: boolean, example: true }
 *                     createdAt: { type: string }
 *                 error: { type: string, nullable: true, example: null }
 *                 timestamp: { type: string }
 *       401:
 *         description: Unauthorized. Invalid or missing authentication token.
 *       403:
 *         description: Forbidden. Not authorized to modify this notification.
 *       404:
 *         description: Notification not found.
 */

/**
 * @swagger
 * /notifications/read-all:
 *   put:
 *     summary: Mark All Notifications as Read
 *     description: Marks all unread notifications for the logged-in user (personal + company/role scoped, or global for Super Admin) as read in bulk.
 *     tags: [notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "All notifications marked as read" }
 *                 data: { type: string, nullable: true, example: null }
 *                 error: { type: string, nullable: true, example: null }
 *                 timestamp: { type: string }
 *       401:
 *         description: Unauthorized. Invalid or missing authentication token.
 */