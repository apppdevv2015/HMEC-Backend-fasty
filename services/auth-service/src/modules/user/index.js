const userController = require('./controllers/user.controller');
const userRoutes = require('./routes/user.routes');
const userService = require('./services/user.service');
const userRepository = require('./repositories/user.repository');
const userValidation = require('./validators/user.validation');

module.exports = {
    userController,
    userRoutes,
    userService,
    userRepository,
    validators: {
        userValidation
    }
};
