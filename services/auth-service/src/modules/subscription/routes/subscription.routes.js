const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const planValidation = require('../../../validations/plan.validation');

const roleMiddleware = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
    next();
};

// --- Public Routes ---
router.get('/', subscriptionController.getAllPlans);
router.get('/plans', subscriptionController.getAllPlans); // Alias for frontend compatibility

// --- Protected Routes (Admin/Any logged in user) ---
router.get('/active', authMiddleware, subscriptionController.getActiveSubscription);
router.get('/subscriptions', authMiddleware, subscriptionController.getCompanySubscriptions);
router.post('/checkout', authMiddleware, subscriptionController.checkout);
router.post('/webhook', subscriptionController.webhook); 

// --- Super Admin Routes (Plan Management) ---
router.get('/admin/subscriptions', authMiddleware, roleMiddleware(['super_admin']), subscriptionController.getCompanySubscriptions);
router.post('/', authMiddleware, roleMiddleware(['super_admin']), planValidation, subscriptionController.createPlan);
router.put('/:id', authMiddleware, roleMiddleware(['super_admin']), planValidation, subscriptionController.updatePlan);
router.delete('/:id', authMiddleware, roleMiddleware(['super_admin']), subscriptionController.deletePlan);


module.exports = router;

