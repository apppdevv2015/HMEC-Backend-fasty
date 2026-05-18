const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const userValidation = require('../../../validations/user.validation');

// Protect all routes
// Users CRUD
router.get('/users', authMiddleware, userController.getUsers);
router.get('/users/:id', authMiddleware, userController.getUser);
router.post('/users', authMiddleware, userValidation, userController.createUser);
router.put('/users/:id', authMiddleware, userValidation, userController.updateUser);
router.delete('/users/:id', authMiddleware, userController.deleteUser);

// Super Admin Management Routes
router.get('/users/super-admin/companies', authMiddleware, userController.getCompanySummaries);

module.exports = router;
