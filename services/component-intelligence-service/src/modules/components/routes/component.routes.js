const express = require('express');
const router = express.Router();
const componentController = require('../controllers/component.controller');
const intelligenceController = require('../../intelligence/controllers/intelligence.controller');
const componentValidation = require('../../../validations/component.validation');
const { authMiddleware, isAdmin } = require('../../../middlewares/auth.middleware');

// Get all component categories
router.get('/categories', authMiddleware, componentController.getCategories);

// Register a new component - Admin Only
router.post('/', authMiddleware, isAdmin, componentValidation, componentController.addComponent);

// Update a component - Admin Only
router.put('/:id', authMiddleware, isAdmin, componentValidation, componentController.updateComponent);

// Delete a component - Admin Only
router.delete('/:id', authMiddleware, isAdmin, componentController.deleteComponent);

// --- Intelligence Engine Endpoints ---

// Get full component register (with intelligence metrics)
router.get('/register', authMiddleware, intelligenceController.getRegister);

// Get dashboard stats (for analytics cards)
router.get('/dashboard-stats', authMiddleware, intelligenceController.getDashboardStats);

module.exports = router;
