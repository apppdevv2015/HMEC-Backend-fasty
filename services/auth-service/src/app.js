const express = require('express');
const db = require('./database/prisma');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'hme-secret-key-2026';
const authRoutes = require('./modules/auth/routes/auth.routes');
const setupSwagger = require('./config/swagger');
const planRoutes = require('./modules/subscription/routes/subscription.routes');
const userRoutes = require('./modules/user/routes/user.routes');
const roleRoutes = require('./modules/role/routes/role.routes');

const authMiddleware = require('./middlewares/auth.middleware');
const errorHandler = require('./middlewares/errorHandler');
const authController = require('./modules/auth/controllers/auth.controller');


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Swagger
setupSwagger(app);


// Request Logger
app.use((req, res, next) => {
    console.log(`[AUTH-SERVICE] ${req.method} ${req.url}`);
    next();
});

// --- Routes ---

// Health Check
app.get('/health', (req, res) => res.json({ status: 'UP', service: 'auth-service' }));

// Auth Module (Login, Register)
app.use('/', authRoutes);

// User & Role Management (Protected)
app.use('/', userRoutes);
app.use('/roles', roleRoutes);


// Dashboard (Protected)
const roleMiddleware = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
    next();
};
// Dashboard moved to auth.routes.js

// Plans & PayFast (Universal Mounting)
app.use('/api/plans', planRoutes);
app.use('/plans', planRoutes);
app.use('/subscriptions', planRoutes);
app.use('/', planRoutes); // Mount at root as fallback for gateway rewrites

// Error Handling
app.use(errorHandler);

module.exports = app;

