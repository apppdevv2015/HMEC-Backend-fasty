const constants = require('./intelligence-calculate');
const scoring = require('./scoring');
const createLogger = require('./logger/logger');
const errors = require('./errors');
const dbLogger = require('./logger/dbLogger');
const dbErrorLogger = require('./logger/dbErrorLogger');
const loggingPrisma = require('./logger/loggingPrisma');
const requestContext = require('./logger/requestContext.middleware');
const requestLogger = require('./logger/requestLogger.middleware');
const errorLogger = require('./logger/errorLogger.middleware');

module.exports = {
    ...constants,
    ...scoring,
    createLogger,
    ...errors,
    ...dbLogger,
    ...dbErrorLogger,
    ...loggingPrisma,
    ...requestContext,
    requestLoggerMiddleware: requestLogger,
    errorLoggerMiddleware: errorLogger
};
