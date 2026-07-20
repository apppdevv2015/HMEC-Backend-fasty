/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User Login and Registration
 *   - name: dashboard
 *     description: Dashboard Analytics and Statistics
 *   - name: alerts
 *     description: Alerts and System Notifications
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new Company and Admin
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [company_name, fname, lname, email, password, mobile_number]
 *             properties:
 *               company_name: { type: string, example: "HME Global" }
 *               fname: { type: string, example: "Aakash" }
 *               lname: { type: string, example: "Admin" }
 *               email: { type: string, example: "admin@gmail.com" }
 *               password: { type: string, example: "admin123" }
 *               mobile_number: { type: string, example: "+1234567890" }
 *     responses:
 *       201:
 *         description: Company and Admin created
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login to get JWT Token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, example: "admin@gmail.com" }
 *               password: { type: string, example: "admin123" }
 *     responses:
 *       200:
 *         description: Login successful
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: User profile
 */

/**
 * @swagger
 * /auth/company/dashboard:
 *   get:
 *     summary: Get Dashboard Analytics (Admin & Super Admin)
 *     tags: [dashboard]
 *     responses:
 *       200:
 *         description: Analytics data based on user role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scope: { type: string, example: "ecosystem" }
 *                 totalCompanies: { type: integer }
 *                 totalUsers: { type: integer }
 *                 roles: { type: array, items: { type: object } }
 * 
 * /auth/company/dashboard/metrics:
 *   get:
 *     summary: Get dashboard KPI metrics (Admin & Super Admin)
 *     tags: [dashboard]
 *     responses:
 *       200:
 *         description: Dashboard metrics successfully fetched
 * 
 * /auth/company/dashboard/plan-distribution:
 *   get:
 *     summary: Get subscription plans distribution percentage (Super Admin only)
 *     tags: [dashboard]
 *     responses:
 *       200:
 *         description: Plan distribution successfully fetched
 * 
 * /auth/company/dashboard/recent-activity:
 *   get:
 *     summary: Get recent platform activities (Super Admin only)
 *     tags: [dashboard]
 *     responses:
 *       200:
 *         description: Recent activity log successfully fetched
 * 
 * /auth/company/dashboard/machine-status:
 *   get:
 *     summary: Get machine status overview counts (Super Admin only)
 *     tags: [dashboard]
 *     responses:
 *       200:
 *         description: Machine status counts successfully fetched
 * 
 * /auth/company/dashboard/alerts-summary:
 *   get:
 *     summary: Get last 7 days alerts summary (Super Admin only)
 *     tags: [alerts]
 *     responses:
 *       200:
 *         description: Alerts summary successfully fetched
 * 
 * /auth/company/dashboard/roles-activity:
 *   get:
 *     summary: Get roles activity history logs (Super Admin only)
 *     tags: [dashboard]
 *     responses:
 *       200:
 *         description: Roles activity logs successfully fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Roles activity logs successfully fetched" }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, example: "a687f897-4abf-47ba-b7e6-7b89f8d910a1" }
 *                       roleName: { type: string, example: "Super Admin" }
 *                       activity: { type: string, example: "Updated system permissions" }
 *                       status: { type: string, example: "active" }
 *                       userCount: { type: integer, example: 2 }
 *                       time: { type: string, format: "date-time", example: "2026-07-14T12:00:00.000Z" }
 * 
 * /auth/company/dashboard/role-details/{id}:
 *   get:
 *     summary: Get detailed information for a specific role (Super Admin only)
 *     tags: [dashboard]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The role ID (UUID or fallback string e.g. '1', '2')
 *     responses:
 *       200:
 *         description: Role details including permissions matrix, assigned users, linked machines, and activity logs successfully fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Role details fetched successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, example: "b9c8d7e6-1234-5678-abcd-1234567890ab" }
 *                     name: { type: string, example: "Super Admin" }
 *                     status: { type: string, example: "active" }
 *                     users: { type: integer, example: 2 }
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           module: { type: string, example: "Dashboard" }
 *                           view: { type: boolean, example: true }
 *                           create: { type: boolean, example: true }
 *                           edit: { type: boolean, example: true }
 *                           delete: { type: boolean, example: true }
 *                     assignedUsers:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Kwame Mensah", "Amina Diallo"]
 *                     linkedMachines:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["All Machines", "All Plants", "All Components"]
 *                     activityHistory:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Updated system permissions", "Created new company admin"]
 */
