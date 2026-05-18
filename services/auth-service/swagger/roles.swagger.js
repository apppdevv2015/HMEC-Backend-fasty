/**
 * @swagger
 * tags:
 *   - name: Roles
 *     description: Role and Permission Management
 */

/**
 * @swagger
 * /auth/roles:
 *   get:
 *     summary: Get all roles (Requires Auth)
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: List of roles
 *   post:
 *     summary: Create a new role (Super Admin Only)
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "supervisor" }
 *     responses:
 *       201:
 *         description: Role created
 */

/**
 * @swagger
 * /auth/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role details
 *   put:
 *     summary: Update a role (Super Admin Only)
 *     tags: [Roles]
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
 *               name: { type: string, example: "updated_role" }
 *     responses:
 *       200:
 *         description: Role updated
 *   delete:
 *     summary: Delete a role (Super Admin Only)
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role deleted
 */
