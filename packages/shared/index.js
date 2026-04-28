const constants = require('./constants');
const scoring = require('./scoring');
const logger = require('./logger');

module.exports = {
    ...constants,
    ...scoring,
    createLogger: logger
};
