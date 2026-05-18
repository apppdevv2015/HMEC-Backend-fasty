/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User Login and Registration
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
 *     tags: [Authentication]
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
 */
