const responseHandler = (res, statusCode, success, message, data = null) => {
    const payload = {
        success,
        message,
        data
    };

    if (typeof res.send === 'function') {
        return res.status(statusCode).send(payload);
    } else {
        return res.status(statusCode).json(payload);
    }
};

module.exports = responseHandler;

