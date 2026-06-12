const { HTTP_STATUS } = require('../errors/statusCodes');
const { codeFromStatus, messageFromStatus, normalizeDetails } = require('../errors/AppError');
const { extractLegacyPagination, normalizePagination } = require('./pagination-builder');

const RESERVED_SUCCESS_KEYS = new Set([
  'success',
  'message',
  'data',
  'pagination',
  'nextCursor',
  'cursor',
  'hasMore',
  'hasNextPage',
  'limit',
  'page',
  'total',
  'totalPages',
  'hasPreviousPage',
]);

function buildResponseMeta(request, options = {}) {
  return {
    requestId: request?.requestId || request?.traceId || request?.id,
    timestamp: new Date().toISOString(),
    service: options.serviceName || request?.serviceName || 'service',
    version: options.apiVersion || options.version || 'v1',
  };
}

function sanitizeJson(value) {
  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeJson);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, child]) => {
      acc[key] = sanitizeJson(child);
      return acc;
    }, {});
  }

  return value;
}

function buildSuccessResponse({
  request,
  serviceName,
  apiVersion,
  message = 'Operation completed successfully',
  data = null,
  pagination,
}) {
  const response = {
    success: true,
    message,
    data: sanitizeJson(data),
  };

  const normalizedPagination = normalizePagination(pagination);

  if (normalizedPagination) {
    response.pagination = normalizedPagination;
  }

  response.meta = buildResponseMeta(request, { serviceName, apiVersion });
  return response;
}

function buildErrorResponse({
  request,
  serviceName,
  apiVersion,
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  code,
  message,
  data,
  details = [],
  expose,
  exposeDetails,
}) {
  const shouldExpose = expose ?? statusCode < HTTP_STATUS.INTERNAL_SERVER_ERROR;

  const response = {
    success: false,
    message: shouldExpose ? message || messageFromStatus(statusCode) : messageFromStatus(statusCode),
  };

  if (data !== undefined) {
    response.data = sanitizeJson(data);
  }

  response.error = {
    code: code || codeFromStatus(statusCode),
    details: shouldExpose || exposeDetails ? sanitizeJson(normalizeDetails(details)) : [],
  };
  response.meta = buildResponseMeta(request, { serviceName, apiVersion });

  return response;
}

function extractLegacyData(body) {
  if (!body || typeof body !== 'object') {
    return body ?? null;
  }

  const hasExplicitData = Object.prototype.hasOwnProperty.call(body, 'data');
  const extra = {};

  for (const [key, value] of Object.entries(body)) {
    if (!RESERVED_SUCCESS_KEYS.has(key)) {
      extra[key] = value;
    }
  }

  if (hasExplicitData && Object.keys(extra).length === 0) {
    return body.data;
  }

  if (hasExplicitData && Object.keys(extra).length > 0) {
    return {
      data: body.data,
      ...extra,
    };
  }

  return Object.keys(extra).length > 0 ? extra : null;
}

function normalizeSuccessBody(body, statusCode, request, options = {}) {
  if (statusCode === HTTP_STATUS.NO_CONTENT) {
    return undefined;
  }

  if (!body || typeof body !== 'object' || Buffer.isBuffer(body)) {
    return buildSuccessResponse({
      request,
      serviceName: options.serviceName,
      apiVersion: options.apiVersion,
      message: messageFromStatus(statusCode),
      data: body ?? null,
    });
  }

  const pagination = extractLegacyPagination(body);

  return buildSuccessResponse({
    request,
    serviceName: options.serviceName,
    apiVersion: options.apiVersion,
    message: body.message || messageFromStatus(statusCode),
    data: extractLegacyData(body),
    pagination,
  });
}

module.exports = {
  buildErrorResponse,
  buildResponseMeta,
  buildSuccessResponse,
  normalizeSuccessBody,
  sanitizeJson,
};
