const { ERROR_CODES } = require('./errorCodes');
const { HTTP_STATUS, STATUS_MESSAGES } = require('./statusCodes');

function codeFromStatus(statusCode) {
  const codes = {
    [HTTP_STATUS.BAD_REQUEST]: ERROR_CODES.VALIDATION_ERROR,
    [HTTP_STATUS.UNAUTHORIZED]: ERROR_CODES.AUTH_REQUIRED,
    [HTTP_STATUS.FORBIDDEN]: ERROR_CODES.FORBIDDEN,
    [HTTP_STATUS.NOT_FOUND]: ERROR_CODES.RESOURCE_NOT_FOUND,
    [HTTP_STATUS.CONFLICT]: ERROR_CODES.CONFLICT_ERROR,
    [HTTP_STATUS.PAYLOAD_TOO_LARGE]: ERROR_CODES.PAYLOAD_TOO_LARGE,
    [HTTP_STATUS.UNPROCESSABLE_ENTITY]: ERROR_CODES.BUSINESS_RULE_FAILED,
    [HTTP_STATUS.TOO_MANY_REQUESTS]: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    [HTTP_STATUS.INTERNAL_SERVER_ERROR]: ERROR_CODES.INTERNAL_SERVER_ERROR,
    [HTTP_STATUS.BAD_GATEWAY]: ERROR_CODES.DOWNSTREAM_SERVICE_ERROR,
    [HTTP_STATUS.SERVICE_UNAVAILABLE]: ERROR_CODES.SERVICE_UNAVAILABLE,
    [HTTP_STATUS.GATEWAY_TIMEOUT]: ERROR_CODES.DOWNSTREAM_SERVICE_ERROR,
  };

  return codes[statusCode] || ERROR_CODES.INTERNAL_SERVER_ERROR;
}

function messageFromStatus(statusCode) {
  return STATUS_MESSAGES[statusCode] || STATUS_MESSAGES[HTTP_STATUS.INTERNAL_SERVER_ERROR];
}

function normalizeFlattenedFieldErrors(details) {
  if (!details || typeof details !== 'object' || !details.fieldErrors) {
    return null;
  }

  const normalized = [];

  for (const [field, messages] of Object.entries(details.fieldErrors || {})) {
    for (const message of Array.isArray(messages) ? messages : [messages]) {
      if (message) {
        normalized.push({ field, message: String(message) });
      }
    }
  }

  for (const message of details.formErrors || []) {
    if (message) {
      normalized.push({ field: 'request', message: String(message) });
    }
  }

  return normalized;
}

function normalizeDetails(details) {
  if (!details) {
    return [];
  }

  // Handle Joi validation errors
  if (details.isJoi && Array.isArray(details.details)) {
    return details.details.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
  }

  // Handle Zod validation errors
  if (details.name === 'ZodError' || (details.issues && Array.isArray(details.issues))) {
    const issues = details.issues || [];
    return issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }

  const flattened = normalizeFlattenedFieldErrors(details);
  if (flattened) {
    return flattened;
  }

  if (Array.isArray(details)) {
    return details.flatMap((item) => {
      if (item && (item.isJoi || item.name === 'ZodError' || item.issues)) {
        return normalizeDetails(item);
      }
      const normalized = normalizeFlattenedFieldErrors(item);
      return normalized || item;
    });
  }

  if (typeof details === 'object') {
    if (details.isJoi || details.name === 'ZodError' || details.issues) {
      return normalizeDetails(details);
    }
    return [details];
  }

  return [{ message: String(details) }];
}

class AppError extends Error {
  constructor(input = {}, legacyStatusCode, legacyDetails, legacyOptions = {}) {
    const options = typeof input === 'object' && input !== null && !(input instanceof String)
      ? input
      : {
          message: input,
          statusCode: legacyStatusCode,
          details: legacyDetails,
          ...legacyOptions,
        };

    const statusCode = Number(options.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR);
    const message = options.message || messageFromStatus(statusCode);

    super(message);
    this.name = options.name || this.constructor.name || 'AppError';
    this.statusCode = statusCode;
    this.code = options.code || codeFromStatus(statusCode);
    this.details = options.details;
    this.errors = options.errors || normalizeDetails(options.details);
    this.isOperational = options.isOperational !== false;
    this.expose = options.expose ?? statusCode < HTTP_STATUS.INTERNAL_SERVER_ERROR;

    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message = 'Invalid request', details) {
    return new AppError({
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      message,
      details,
    });
  }

  static validation(message = 'Validation failed', details = []) {
    return new AppError({
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      message,
      details,
    });
  }

  static unauthorized(message = 'Authentication is required') {
    return new AppError({
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      code: ERROR_CODES.AUTH_REQUIRED,
      message,
    });
  }

  static invalidToken(message = 'Invalid token') {
    return new AppError({
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      code: ERROR_CODES.INVALID_TOKEN,
      message,
    });
  }

  static tokenExpired(message = 'Token expired') {
    return new AppError({
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      code: ERROR_CODES.TOKEN_EXPIRED,
      message,
    });
  }

  static forbidden(message = 'Forbidden') {
    return new AppError({
      statusCode: HTTP_STATUS.FORBIDDEN,
      code: ERROR_CODES.FORBIDDEN,
      message,
    });
  }

  static notFound(message = 'Resource not found') {
    return new AppError({
      statusCode: HTTP_STATUS.NOT_FOUND,
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message,
    });
  }

  static conflict(message = 'Request conflicts with current resource state', details) {
    return new AppError({
      statusCode: HTTP_STATUS.CONFLICT,
      code: ERROR_CODES.CONFLICT_ERROR,
      message,
      details,
    });
  }

  static resourceAlreadyExists(message = 'Resource already exists', details) {
    return new AppError({
      statusCode: HTTP_STATUS.CONFLICT,
      code: ERROR_CODES.RESOURCE_ALREADY_EXISTS,
      message,
      details,
    });
  }

  static businessRule(message = 'Business validation failed', details) {
    // Map known message pattern to specific error codes if applicable
    let code = ERROR_CODES.BUSINESS_RULE_FAILED;
    if (message.includes('COMPANY_ADMIN_LIMIT_REACHED')) {
      code = ERROR_CODES.COMPANY_ADMIN_LIMIT_REACHED;
    } else if (message.includes('STAFF_LIMIT_REACHED')) {
      code = ERROR_CODES.STAFF_LIMIT_REACHED;
    } else if (message.includes('DEMO_ALREADY_USED')) {
      code = ERROR_CODES.DEMO_ALREADY_USED;
    } else if (message.includes('limit reached') || message.includes('Limit reached')) {
      code = ERROR_CODES.SUBSCRIPTION_LIMIT_REACHED;
    }

    return new AppError({
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code,
      message,
      details,
    });
  }

  static payloadTooLarge(message = 'Request body is too large') {
    return new AppError({
      statusCode: HTTP_STATUS.PAYLOAD_TOO_LARGE,
      code: ERROR_CODES.PAYLOAD_TOO_LARGE,
      message,
    });
  }

  static rateLimited(message = 'Too many requests') {
    return new AppError({
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message,
    });
  }

  static timeout(message = 'Request timed out') {
    return new AppError({
      statusCode: HTTP_STATUS.GATEWAY_TIMEOUT,
      code: ERROR_CODES.REQUEST_TIMEOUT,
      message,
    });
  }

  static database(message = 'Database operation failed', details) {
    return new AppError({
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.DATABASE_ERROR,
      message,
      details,
      expose: false,
    });
  }

  static downstream(message = 'Downstream service request failed', details) {
    return new AppError({
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
      code: ERROR_CODES.DOWNSTREAM_SERVICE_ERROR,
      message,
      details,
    });
  }

  static serviceUnavailable(message = 'Service temporarily unavailable', details) {
    return new AppError({
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
      code: ERROR_CODES.SERVICE_UNAVAILABLE,
      message,
      details,
    });
  }

  static internal(message = 'Internal server error', details) {
    return new AppError({
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message,
      details,
      expose: false,
    });
  }

  static fromPrisma(error) {
    // Unique constraint failed
    if (error.code === 'P2002') {
      const target = error.meta?.target || [];
      return new AppError({
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.RESOURCE_ALREADY_EXISTS,
        message: `Resource with duplicate field values (${target.join(', ')}) already exists.`,
        details: { fields: target }
      });
    }
    // Record not found
    if (error.code === 'P2025') {
      return new AppError({
        statusCode: HTTP_STATUS.NOT_FOUND,
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
        message: error.meta?.cause || 'Resource not found.'
      });
    }
    // Foreign key constraint failed
    if (error.code === 'P2003') {
      return new AppError({
        statusCode: HTTP_STATUS.BAD_REQUEST,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: `Foreign key constraint failed on field: ${error.meta?.field_name || 'unknown'}`
      });
    }

    // Default DB error
    return new AppError({
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.DATABASE_ERROR,
      message: 'Database operation failed',
      expose: false
    });
  }
}

// Subclasses for backwards-compatibility with the legacy shared errors
class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details) {
    super({ statusCode: HTTP_STATUS.BAD_REQUEST, code: ERROR_CODES.VALIDATION_ERROR, message, details });
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super({ statusCode: HTTP_STATUS.UNAUTHORIZED, code: ERROR_CODES.AUTH_REQUIRED, message });
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super({ statusCode: HTTP_STATUS.FORBIDDEN, code: ERROR_CODES.FORBIDDEN, message });
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super({ statusCode: HTTP_STATUS.NOT_FOUND, code: ERROR_CODES.RESOURCE_NOT_FOUND, message });
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict', details) {
    super({ statusCode: HTTP_STATUS.CONFLICT, code: ERROR_CODES.CONFLICT_ERROR, message, details });
  }
}

class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', details) {
    super({ statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: ERROR_CODES.INTERNAL_SERVER_ERROR, message, details, expose: false });
  }
}

/**
 * Formats an error into a standardized API response payload.
 */
function formatError(error) {
  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const isOperational = error.isOperational ?? false;
  const expose = error.expose ?? (statusCode < HTTP_STATUS.INTERNAL_SERVER_ERROR);

  const name = error.name || error.constructor.name || 'Error';
  const code = error.code || codeFromStatus(statusCode);
  
  // Resolve message (don't expose internal/unknown errors to users)
  const message = (isOperational || expose) 
    ? error.message 
    : STATUS_MESSAGES[HTTP_STATUS.INTERNAL_SERVER_ERROR];

  // Try to parse message for known limit errors if it's a generic operational error
  let resolvedCode = code;
  if (message.includes('COMPANY_ADMIN_LIMIT_REACHED')) {
    resolvedCode = ERROR_CODES.COMPANY_ADMIN_LIMIT_REACHED;
  } else if (message.includes('STAFF_LIMIT_REACHED')) {
    resolvedCode = ERROR_CODES.STAFF_LIMIT_REACHED;
  } else if (message.includes('DEMO_ALREADY_USED')) {
    resolvedCode = ERROR_CODES.DEMO_ALREADY_USED;
  } else if (message.includes('limit reached') || message.includes('Limit reached')) {
    resolvedCode = ERROR_CODES.SUBSCRIPTION_LIMIT_REACHED;
  }

  return {
    success: false,
    status: String(statusCode).startsWith('4') ? 'fail' : 'error',
    statusCode,
    code: resolvedCode,
    message,
    error: name,
    errors: error.errors || normalizeDetails(error.details || error),
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  codeFromStatus,
  messageFromStatus,
  normalizeDetails,
  formatError,
};
