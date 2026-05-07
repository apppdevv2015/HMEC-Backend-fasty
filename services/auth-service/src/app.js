const express = require('express');
const db = require('./database');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'hme-secret-key-2026';
const authRoutes = require('./modules/auth/routes/auth.routes');
const subscriptionRoutes = require('./modules/subscription/routes/subscription.routes');
const authMiddleware = require('./middlewares/auth.middleware');
const authController = require('./modules/auth/controllers/auth.controller');

const app = express();
app.use(express.json());

// --- Routes ---

// Health Check
app.get('/health', (req, res) => res.json({ status: 'UP', service: 'auth-service' }));

// Auth Module (Login, Register)
app.use('/', authRoutes);

// Dashboard (Protected)
const roleMiddleware = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
    next();
};
app.get('/company/dashboard', authMiddleware, roleMiddleware(['admin', 'super_admin']), authController.getDashboard);

// Subscriptions & PayFast
app.use('/subscriptions', subscriptionRoutes);

module.exports = app;
