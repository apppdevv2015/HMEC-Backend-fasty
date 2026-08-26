const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500
};

const responseHandler = (res, statusCode, success, message, data = null, meta = null) => {
    // If called with (res, statusCode, message, data)
    if (typeof success === 'string' && data === null && meta === null) {
        message = success;
        success = statusCode >= 200 && statusCode < 300;
    }

    const payload = {
        success: Boolean(success),
        statusCode,
        message,
        data,
        timestamp: new Date().toISOString()
    };

    if (meta) {
        payload.meta = meta;
    }

    return res.status(statusCode).send(payload);
};

responseHandler.HTTP_STATUS = HTTP_STATUS;

module.exports = responseHandler;
