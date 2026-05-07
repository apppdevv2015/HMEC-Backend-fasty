const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
// Note: Middleware should be imported from a central place, but for now we'll assume they are passed or required correctly
// In a full refactor, middlewares move to src/middlewares

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authMiddleware, authController.logout);
router.get('/dashboard', authMiddleware, authController.getDashboard);

// Activity Logs (Super Admin Only)
router.get('/logs', authMiddleware, (req, res, next) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Access denied' });
    next();
}, authController.getActivityLogs);

module.exports = router;
