const responseHandler = (res, statusCode, message, data = null, error = null) => {
    const payload = {
        success: statusCode >= 200 && statusCode < 300,
        message,
        data,
        error: error ? (typeof error === 'string' ? error : error.message) : null,
        timestamp: new Date().toISOString()
    };

    if (typeof res.send === 'function') {
        return res.status(statusCode).send(payload);
    } else {
        return res.status(statusCode).json(payload);
    }
};

module.exports = responseHandler;
