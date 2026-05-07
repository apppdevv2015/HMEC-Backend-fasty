const express = require('express');
const router = express.Router();
const intelligenceController = require('../controllers/intelligence.controller');

router.get('/status', intelligenceController.getStatus);
router.post('/analyze/:machineId', intelligenceController.runAnalysis);

module.exports = router;
