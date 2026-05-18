const responseHandler = (res, statusCode, message, data = null, error = null) => {
    return res.status(statusCode).json({
        success: statusCode >= 200 && statusCode < 300,
        message,
        data,
        error: error ? (typeof error === 'string' ? error : error.message) : null,
        timestamp: new Date().toISOString()
    });
};

module.exports = responseHandler;
