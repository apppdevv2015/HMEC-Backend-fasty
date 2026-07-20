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
 * Standardized API Response Handler
 * Supports both signatures:
 * 1. responseHandler(res, statusCode, message, data, error)
 * 2. responseHandler(res, statusCode, data, error) -> Message is auto-resolved from statusCode
 */
const responseHandler = (res, statusCode, messageOrData = null, data = null, error = null) => {
    let message = '';
    let finalData = data;
    let finalError = error;

    // Check if the third parameter is a custom message string
    if (typeof messageOrData === 'string') {
        message = messageOrData;
        // If data is passed as Error, move it to finalError
        if (data instanceof Error) {
            finalError = data;
            finalData = null;
        }
    } else if (messageOrData instanceof Error) {
        // If third parameter is directly an Error object
        finalError = messageOrData;
        finalData = null;
        message = DEFAULT_MESSAGES[statusCode] || 'An error occurred';
    } else {
        // If third parameter is not a string/Error, treat it as data/payload
        finalData = messageOrData;
        message = DEFAULT_MESSAGES[statusCode] || 'Request completed';
        
        // Check if fourth parameter is an Error
        if (data instanceof Error) {
            finalError = data;
            finalData = null;
        }
    }

    const payload = {
        success: statusCode >= 200 && statusCode < 300,
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

