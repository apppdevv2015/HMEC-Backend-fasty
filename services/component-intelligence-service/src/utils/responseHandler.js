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

const DEFAULT_MESSAGES = {
    [HTTP_STATUS.OK]: 'Request processed successfully',
    [HTTP_STATUS.CREATED]: 'Resource created successfully',
    [HTTP_STATUS.ACCEPTED]: 'Request accepted for processing',
    [HTTP_STATUS.NO_CONTENT]: 'No content available',
    [HTTP_STATUS.BAD_REQUEST]: 'Bad request. Validation failed',
    [HTTP_STATUS.UNAUTHORIZED]: 'Authentication required. Please login',
    [HTTP_STATUS.FORBIDDEN]: 'Access denied. Insufficient permissions',
    [HTTP_STATUS.NOT_FOUND]: 'Requested resource not found',
    [HTTP_STATUS.CONFLICT]: 'Resource conflict occurred',
    [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'Unable to process the request payload',
    [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'An unexpected internal server error occurred'
};

/**
 * Enterprise Unified API Response Handler
 * Supports all signatures:
 * 1. responseHandler(res, statusCode, success, message, data) -> Legacy CIS signature
 * 2. responseHandler(res, statusCode, message, data, error) -> Standard signature
 * 3. responseHandler(res, statusCode, data, error) -> Auto-resolved message
 */
const responseHandler = (res, statusCode, param3 = null, param4 = null, param5 = null) => {
    let success = statusCode >= 200 && statusCode < 300;
    let message = '';
    let finalData = null;
    let finalError = null;

    if (typeof param3 === 'boolean') {
        // Signature: (res, statusCode, success, message, data)
        success = param3;
        message = param4 || DEFAULT_MESSAGES[statusCode] || 'Request completed';
        finalData = param5;
    } else if (typeof param3 === 'string') {
        // Signature: (res, statusCode, message, data, error)
        message = param3;
        finalData = param4;
        finalError = param5;
        if (finalData instanceof Error) {
            finalError = finalData;
            finalData = null;
        }
    } else {
        // Signature: (res, statusCode, data, error)
        finalData = param3;
        finalError = param4;
        message = DEFAULT_MESSAGES[statusCode] || 'Request completed';
        if (finalData instanceof Error) {
            finalError = finalData;
            finalData = null;
        }
    }

    const payload = {
        success,
        message,
        data: finalData,
        error: finalError ? (typeof finalError === 'string' ? finalError : finalError.message) : null,
        timestamp: new Date().toISOString()
    };

    if (typeof res.send === 'function') {
        return res.status(statusCode).send(payload);
    } else {
        return res.status(statusCode).json(payload);
    }
};

responseHandler.HTTP_STATUS = HTTP_STATUS;
responseHandler.DEFAULT_MESSAGES = DEFAULT_MESSAGES;

module.exports = responseHandler;


