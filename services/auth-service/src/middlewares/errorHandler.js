const responseHandler = require('../utils/responseHandler');

const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.stack}`);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    return responseHandler(res, statusCode, message, null, err);
};

module.exports = errorHandler;
