const express = require('express');
const router = express.Router();
const machineController = require('../controllers/machine.controller');
const { authMiddleware, isAdmin } = require('../../../middlewares/auth.middleware');

router.post('/', authMiddleware, isAdmin, machineController.addMachine);
router.get('/', authMiddleware, machineController.getMachines);

module.exports = router;
