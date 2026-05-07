const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
// Note: Middleware should be imported from a central place, but for now we'll assume they are passed or required correctly
// In a full refactor, middlewares move to src/middlewares

router.post('/login', authController.login);
router.post('/register', authController.register);

module.exports = router;
