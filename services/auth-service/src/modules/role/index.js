const roleController = require('./controllers/role.controller');
const roleRoutes = require('./routes/role.routes');
const roleService = require('./services/role.service');
const roleRepository = require('./repositories/role.repository');
const roleValidation = require('./validators/role.validation');

module.exports = {
    roleController,
    roleRoutes,
    roleService,
    roleRepository,
    validators: {
        roleValidation
    }
};
