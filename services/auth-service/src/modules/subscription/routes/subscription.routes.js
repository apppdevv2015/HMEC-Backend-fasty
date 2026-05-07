const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');

const roleMiddleware = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
    next();
};

// --- Public Routes ---
router.get('/plans', subscriptionController.getAllPlans);

// --- Protected Routes (Admin/Any logged in user) ---
router.post('/checkout', authMiddleware, subscriptionController.checkout);
router.post('/webhook', subscriptionController.webhook); // PayFast Webhook (No auth, but should verify signature)

// --- Super Admin Routes (Plan Management) ---
router.post('/plans', authMiddleware, roleMiddleware(['super_admin']), subscriptionController.createPlan);
router.put('/plans/:id', authMiddleware, roleMiddleware(['super_admin']), subscriptionController.updatePlan);
router.delete('/plans/:id', authMiddleware, roleMiddleware(['super_admin']), subscriptionController.deletePlan);

module.exports = router;
