const responseHandler = require('../utils/responseHandler');

const errorHandler = (error, request, reply) => {
    console.error(`[ERROR] ${error.stack}`);

    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || 'Internal Server Error';

    return responseHandler(reply, statusCode, message, null, error);
};

module.exports = errorHandler;
