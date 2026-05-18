const express = require('express');
const router = express.Router();
const intelligenceController = require('../controllers/intelligence.controller');
const { authMiddleware } = require('../../../middlewares/auth.middleware');

router.get('/register', authMiddleware, intelligenceController.getRegister);
router.get('/dashboard-stats', authMiddleware, intelligenceController.getDashboardStats);

module.exports = router;
