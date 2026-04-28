const express = require('express');
const path = require('path');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const app = express();

app.use(cors()); // Enable CORS for browser access

// --- 1. Swagger Definition ---
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HME Intelligence System API',
            version: '1.0.0',
            description: 'Centralized API Gateway with JWT Security',
        },
        servers: [{ url: 'http://localhost:4000', description: 'Local Gateway' }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: [path.join(process.cwd(), 'services/api-gateway/src/app.js'), './src/app.js'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Request Logger
app.use((req, res, next) => {
    console.log(`[GATEWAY] ${req.method} ${req.url}`);
    next();
});

// --- 2. Service Configuration ---
// When running locally (npm run dev), defaults to localhost.
// When running in Docker, env vars override these with container names.
const SERVICES = {
    intelligence: process.env.INTELLIGENCE_SERVICE_URL || 'http://localhost:3001',
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
    fleet: process.env.FLEET_SERVICE_URL || 'http://localhost:3003',
    ingestion: process.env.INGESTION_SERVICE_URL || 'http://localhost:3004',
    notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005'
};

// --- 3. Authentication & Roles Docs ---

/**
 * @swagger
 * /api/auth/register:
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
 *             required:
 *               - name
 *               - fname
 *               - lname
 *               - email
 *               - password
 *             properties:
 *               name: { type: string, example: "HME Global" }
 *               fname: { type: string, example: "Aakash" }
 *               lname: { type: string, example: "Admin" }
 *               email: { type: string, example: "admin@gmail.com" }
 *               password: { type: string, example: "admin" }
 *               mobile: { type: string, example: "9876543210" }
 *     responses:
 *       201:
 *         description: Company and Admin created successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/auth/login:
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
 *               password: { type: string, example: "admin" }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/auth/roles:
 *   get:
 *     summary: Get all roles (Requires Auth)
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: List of roles
 *   post:
 *     summary: Create a new role (Admin Only)
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "technician" }
 *     responses:
 *       201:
 *         description: Role created
 */

/**
 * @swagger
 * /api/auth/roles/{id}:
 *   put:
 *     summary: Update a role (Admin Only)
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200:
 *         description: Role updated
 *   delete:
 *     summary: Delete a role (Admin Only)
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role deleted
 */

app.get('/health', (req, res) => {
    res.json({ status: 'UP', gateway: 'HME API Gateway', port: 4000 });
});

// Proxy Routes
Object.entries(SERVICES).forEach(([name, url]) => {
    app.use(`/api/${name}`, createProxyMiddleware({
        target: url,
        changeOrigin: true,
        pathRewrite: { [`^/api/${name}`]: '' },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`[GATEWAY-PROXY] ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
        }
    }));
});

module.exports = app;
