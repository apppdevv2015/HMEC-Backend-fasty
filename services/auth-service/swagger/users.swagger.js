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
 *     summary: Create a new user (Admin/Super Admin Only)
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
 *     summary: Get a summary of all companies and their staff counts (Super Admin Only)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of company summaries
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
