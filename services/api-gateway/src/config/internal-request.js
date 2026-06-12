const { buildTrustedUserHeaders } = require('../runtime');

function buildInternalHeaders(req) {
  const headers = {};
  const internalServiceToken = process.env.INTERNAL_SERVICE_TOKEN;
  const serviceName = process.env.SERVICE_NAME || process.env.INTERNAL_SERVICE_NAME || 'api-gateway';
  const requestId = req?.traceId || req?.requestId || req?.headers?.['x-request-id'];
  const authorization = req?.headers?.authorization;
  const userContext = req?.auth || req?.user;

  if (internalServiceToken) {
    headers['x-service-name'] = serviceName;
    headers['x-internal-token'] = internalServiceToken;
    headers['x-internal-service-token'] = internalServiceToken;
  }

  if (requestId) {
    headers['x-request-id'] = requestId;
    headers['x-trace-id'] = requestId;
    headers['x-correlation-id'] = requestId;
  }

  if (authorization) {
    headers.authorization = authorization;
  }

  if (userContext?.id || userContext?.sub) {
    Object.assign(headers, buildTrustedUserHeaders(userContext));
  }

  return headers;
}

module.exports = {
  buildInternalHeaders,
};
