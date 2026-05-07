const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');

// Helper middleware for role-based access
const authorize = (roles) => (req, res, next) => {
    console.log(`[AUTH-CHECK] User Role: ${req.user.role} | Required: ${roles}`);
    if (!roles.includes(req.user.role)) {
        console.log(`[AUTH-DENIED] Role ${req.user.role} is not in ${roles}`);
        return res.status(403).json({ error: 'Access denied. Super Admin only.' });
    }
    next();
};

// Protect all role routes with authentication
router.use(authMiddleware);

// Publicly viewable by all authenticated users
router.get('/', roleController.getRoles);
router.get('/:id', roleController.getRole);

// Restricted to Super Admin only
router.post('/', authorize(['super_admin']), roleController.createRole);
router.put('/:id', authorize(['super_admin']), roleController.updateRole);
router.delete('/:id', authorize(['super_admin']), roleController.deleteRole);

module.exports = router;
