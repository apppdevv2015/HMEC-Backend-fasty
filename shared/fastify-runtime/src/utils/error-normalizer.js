const { AppError, codeFromStatus, messageFromStatus, normalizeDetails } = require('../errors/AppError');
const { ERROR_CODES } = require('../errors/errorCodes');
const { HTTP_STATUS } = require('../errors/statusCodes');

function normalizeZodErrors(error) {
  if (!error?.issues) {
    const flattened = error?.flatten?.();
    if (flattened?.fieldErrors) {
      return Object.entries(flattened.fieldErrors).flatMap(([field, messages]) =>
        (messages || []).map((message) => ({ field, message }))
      );
    }

    return normalizeDetails(flattened || error);
  }

  return error.issues.map((issue) => ({
    field: issue.path?.length ? issue.path.join('.') : undefined,
    message: issue.message,
  }));
}

function normalizeFastifyValidationErrors(error) {
  const context = error.validationContext || 'request';
  const validation = Array.isArray(error.validation) ? error.validation : [];

  return validation.map((item) => {
    const instancePath = String(item.instancePath || '').replace(/^\//, '').replace(/\//g, '.');
    const missing = item.params?.missingProperty;
    const field = [context, instancePath, missing].filter(Boolean).join('.');

    return {
      field,
      message: item.message || 'is invalid',
    };
  });
}

function normalizePrismaError(error) {
  if (error.code === 'P2002') {
    return {
      statusCode: HTTP_STATUS.CONFLICT,
      code: ERROR_CODES.RESOURCE_ALREADY_EXISTS,
      message: 'A record with these details already exists',
      details: error.meta?.target ? [{ field: String(error.meta.target), message: 'must be unique' }] : [],
      internalMessage: error.message,
    };
  }

  if (error.code === 'P2025') {
    return {
      statusCode: HTTP_STATUS.NOT_FOUND,
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Resource not found',
      details: [],
      internalMessage: error.message,
    };
  }

  if (error.code === 'P2003') {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Referenced resource does not exist',
      details: [],
      internalMessage: error.message,
    };
  }

  if (['P1001', 'P1002', 'P1008'].includes(error.code)) {
    return {
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
      code: ERROR_CODES.DATABASE_ERROR,
      message: 'Database is temporarily unavailable',
      details: [],
      internalMessage: error.message,
    };
  }

  return {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: ERROR_CODES.DATABASE_ERROR,
    message: messageFromStatus(HTTP_STATUS.INTERNAL_SERVER_ERROR),
    details: [],
    internalMessage: error.message,
  };
}

function normalizeAxiosError(error) {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return {
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
      code: ERROR_CODES.DOWNSTREAM_SERVICE_ERROR,
      message: 'Downstream service timed out',
      details: [],
      internalMessage: error.message,
    };
  }

  const responseStatus = Number(error.response?.status);
  const statusCode = responseStatus && responseStatus < 500
    ? responseStatus
    : HTTP_STATUS.SERVICE_UNAVAILABLE;

  return {
    statusCode,
    code: statusCode >= 500
      ? ERROR_CODES.DOWNSTREAM_SERVICE_ERROR
      : error.response?.data?.error?.code || error.response?.data?.code || codeFromStatus(statusCode),
    message: statusCode >= 500
      ? 'Downstream service is temporarily unavailable'
      : error.response?.data?.message || messageFromStatus(statusCode),
    details: normalizeDetails(
      error.response?.data?.error?.details ||
      error.response?.data?.errors ||
      error.response?.data?.details
    ),
    internalMessage: error.message,
  };
}

function normalizeError(error, options = {}) {
  const isProduction = options.isProduction ?? process.env.NODE_ENV === 'production';

  if (error?.validation) {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Validation failed',
      details: normalizeFastifyValidationErrors(error),
      internalMessage: error.message,
      stack: isProduction ? undefined : error.stack,
    };
  }

  if (error instanceof AppError || error?.isOperational || error?.statusCode) {
    const statusCode = Number(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR);
    const expose = error.expose ?? statusCode < HTTP_STATUS.INTERNAL_SERVER_ERROR;

    return {
      statusCode,
      code: error.code || codeFromStatus(statusCode),
      message: expose ? error.message || messageFromStatus(statusCode) : messageFromStatus(statusCode),
      details: expose ? normalizeDetails(error.errors || error.details) : [],
      internalMessage: error.message,
      stack: isProduction ? undefined : error.stack,
    };
  }

  if (error?.name === 'ZodError') {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Validation failed',
      details: normalizeZodErrors(error),
      internalMessage: error.message,
      stack: isProduction ? undefined : error.stack,
    };
  }

  if (error?.code === 'FST_ERR_CTP_INVALID_JSON_BODY' || error instanceof SyntaxError) {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.INVALID_JSON,
      message: 'Malformed JSON request body',
      details: [],
      internalMessage: error.message,
      stack: isProduction ? undefined : error.stack,
    };
  }

  if (error?.statusCode === HTTP_STATUS.PAYLOAD_TOO_LARGE || error?.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
    return {
      statusCode: HTTP_STATUS.PAYLOAD_TOO_LARGE,
      code: ERROR_CODES.PAYLOAD_TOO_LARGE,
      message: 'Request body is too large',
      details: [],
      internalMessage: error.message,
      stack: isProduction ? undefined : error.stack,
    };
  }

  if (error?.name === 'TokenExpiredError') {
    return {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      code: ERROR_CODES.TOKEN_EXPIRED,
      message: 'Token expired',
      details: [],
      internalMessage: error.message,
      stack: isProduction ? undefined : error.stack,
    };
  }

  if (error?.name === 'JsonWebTokenError') {
    return {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      code: ERROR_CODES.INVALID_TOKEN,
      message: 'Invalid token',
      details: [],
      internalMessage: error.message,
      stack: isProduction ? undefined : error.stack,
    };
  }

  if (error?.message === 'Origin not allowed by CORS policy') {
    return {
      statusCode: HTTP_STATUS.FORBIDDEN,
      code: ERROR_CODES.CORS_FORBIDDEN,
      message: 'Origin is not allowed',
      details: [error],
      internalMessage: error.message,
      stack: isProduction ? undefined : error.stack,
    };
  }

  if (error?.code && String(error.code).startsWith('P')) {
    return normalizePrismaError(error);
  }

  if (error?.isAxiosError) {
    return normalizeAxiosError(error);
  }

  return {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    message: messageFromStatus(HTTP_STATUS.INTERNAL_SERVER_ERROR),
    details: [],
    internalMessage: error?.message || messageFromStatus(HTTP_STATUS.INTERNAL_SERVER_ERROR),
    stack: isProduction ? undefined : error?.stack,
  };
}

module.exports = {
  normalizeError,
  normalizeFastifyValidationErrors,
  normalizeZodErrors,
};
