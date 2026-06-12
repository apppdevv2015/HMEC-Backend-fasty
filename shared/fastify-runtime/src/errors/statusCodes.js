const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
});

const STATUS_MESSAGES = Object.freeze({
  [HTTP_STATUS.OK]: 'Operation completed successfully',
  [HTTP_STATUS.CREATED]: 'Resource created successfully',
  [HTTP_STATUS.NO_CONTENT]: 'No content',
  [HTTP_STATUS.BAD_REQUEST]: 'Invalid request',
  [HTTP_STATUS.UNAUTHORIZED]: 'Authentication is required',
  [HTTP_STATUS.FORBIDDEN]: 'Forbidden',
  [HTTP_STATUS.NOT_FOUND]: 'Resource not found',
  [HTTP_STATUS.CONFLICT]: 'Request conflicts with current resource state',
  [HTTP_STATUS.PAYLOAD_TOO_LARGE]: 'Request body is too large',
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'Business validation failed',
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too many requests',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [HTTP_STATUS.BAD_GATEWAY]: 'Downstream service request failed',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [HTTP_STATUS.GATEWAY_TIMEOUT]: 'Downstream service timed out',
});

module.exports = {
  HTTP_STATUS,
  STATUS_MESSAGES,
};
