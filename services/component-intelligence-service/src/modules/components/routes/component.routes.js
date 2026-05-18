const express = require('express');
const router = express.Router();
const componentController = require('../controllers/component.controller');
const intelligenceController = require('../controllers/intelligence.controller');
const componentValidation = require('../../../validations/component.validation');
const { authMiddleware, isAdmin } = require('../../../middlewares/auth.middleware');

// Register a new component - Admin Only
router.post('/', authMiddleware, isAdmin, componentValidation, componentController.addComponent);

// Update a component - Admin Only
router.put('/:id', authMiddleware, isAdmin, componentValidation, componentController.updateComponent);

// --- Intelligence Engine Endpoints ---

// Get full component register (with intelligence metrics)
router.get('/register', authMiddleware, intelligenceController.getRegister);

// Get dashboard stats (for analytics cards)
router.get('/dashboard-stats', authMiddleware, intelligenceController.getDashboardStats);

module.exports = router;
