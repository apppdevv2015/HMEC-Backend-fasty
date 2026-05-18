const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const loginValidation = require('../../../validations/login.validation');
const registerValidation = require('../../../validations/register.validation');
const authMiddleware = require('../../../middlewares/auth.middleware');

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/me', authMiddleware, authController.getMe);

const roleMiddleware = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
    next();
};
router.get('/company/dashboard', authMiddleware, roleMiddleware(['admin', 'super_admin']), authController.getDashboard);

module.exports = router;
