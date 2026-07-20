/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Site/Company User Management
 */

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: List all users with Search & Filters
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: company_id
 *         description: Filter by Company ID (Super Admin Only)
 *         schema:
 *           type: string
 *       - in: query
 *         name: role_name
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users
 *   post:
 *     summary: Create new company staff by Admin or Super Admin
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name: { type: string, example: "Priya" }
 *               last_name: { type: string, example: "Kumari" }
 *               email: { type: string, example: "priya@gmail.com" }
 *               role_name: { type: string, example: "engineer" }
 *               password: { type: string, description: "Optional. If not provided, a random password will be generated and emailed.", example: "HME@staff2026" }
 *               mobile_number: { type: string, example: "+1234567890" }
 *     responses:
 *       201:
 *         description: User created
 */

/**
 * @swagger
 * /auth/users/super-admin/companies:
 *   get:
 *     summary: Get a summary of all companies and their staff counts (Super Admin & Sub Super Admin Only)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of company summaries
 */

/**
 * @swagger
 * /auth/users/sub-super-admin:
 *   post:
 *     summary: Create a new Sub Super Admin user (Super Admin Only)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *             properties:
 *               first_name: { type: string, example: "Jane" }
 *               last_name: { type: string, example: "Doe" }
 *               email: { type: string, example: "subsuper@hme.com" }
 *               password: { type: string, example: "Password@123" }
 *               mobile_number: { type: string, example: "+1234567890" }
 *     responses:
 *       201:
 *         description: Sub Super Admin created
 *       400:
 *         description: Invalid inputs or user already exists
 *       403:
 *         description: Access denied (Super Admin only)
 */

/**
 * @swagger
 * /auth/users/sub-admin:
 *   post:
 *     summary: Create a new Sub Admin user for the company (Admin & Super Admin Only)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - first_name
 *             properties:
 *               first_name: { type: string, example: "Aman" }
 *               last_name: { type: string, example: "Sharma" }
 *               email: { type: string, example: "aman.sharma@company.com" }
 *               password: { type: string, description: "Optional. If not provided, a random password will be generated.", example: "HME@sub2026" }
 *               mobile_number: { type: string, example: "+1234567890" }
 *               company_id: { type: string, description: "Optional. Only required for Super Admin to create sub-admin for a specific company." }
 *     responses:
 *       201:
 *         description: Sub Admin created
 *       400:
 *         description: Invalid inputs or user already exists
 *       403:
 *         description: Access denied (Admin or Super Admin only)
 */

/**
 * @swagger
 * /auth/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *   put:
 *     summary: Update user details
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               email: { type: string }
 *               mobile_number: { type: string, example: "+1234567890" }
 *     responses:
 *       200:
 *         description: User updated
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 */

/**
 * @swagger
 * /auth/users/company/{companyId}/staff:
 *   get:
 *     summary: Get all non-admin staff details of a company by company ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The company ID
 *     responses:
 *       200:
 *         description: List of company staff
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   firstName: { type: string }
 *                   lastName: { type: string }
 *                   email: { type: string }
 *                   mobileNumber: { type: string }
 *                   isActive: { type: boolean }
 *                   createdAt: { type: string, format: date-time }
 *                   role: { type: string }
 *       403:
 *         description: Access denied (You can only view your own company staff)
 */
