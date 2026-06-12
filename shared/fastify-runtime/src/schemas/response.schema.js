const commonSchemas = {
  ResponseMeta: {
    type: 'object',
    required: ['timestamp'],
    properties: {
      requestId: { type: 'string', format: 'uuid', example: '018f6d1f-5c0e-7b5c-8b31-7e871f28c4f2' },
      timestamp: { type: 'string', format: 'date-time', example: '2026-06-04T18:03:27.000Z' },
      service: { type: 'string', example: 'auth-service' },
      version: { type: 'string', example: 'v1' },
    },
  },
  ErrorDetail: {
    type: 'object',
    properties: {
      field: { type: 'string', example: 'email' },
      message: { type: 'string', example: 'must be a valid email' },
    },
    additionalProperties: true,
  },
  ErrorObject: {
    type: 'object',
    required: ['code', 'details'],
    properties: {
      code: { type: 'string', example: 'VALIDATION_ERROR' },
      details: {
        type: 'array',
        items: { $ref: '#/components/schemas/ErrorDetail' },
      },
    },
  },
  CursorPaginationMeta: {
    type: 'object',
    required: ['type', 'limit', 'nextCursor', 'hasNextPage'],
    properties: {
      type: { type: 'string', enum: ['cursor'], example: 'cursor' },
      limit: { type: 'integer', minimum: 1, example: 10 },
      nextCursor: { type: 'string', nullable: true, example: '2026-06-04T18:03:27.000Z' },
      hasNextPage: { type: 'boolean', example: true },
    },
  },
  PagePaginationMeta: {
    type: 'object',
    required: ['type', 'page', 'limit', 'total', 'totalPages', 'hasNextPage', 'hasPreviousPage'],
    properties: {
      type: { type: 'string', enum: ['page'], example: 'page' },
      page: { type: 'integer', minimum: 1, example: 1 },
      limit: { type: 'integer', minimum: 1, example: 10 },
      total: { type: 'integer', minimum: 0, example: 150 },
      totalPages: { type: 'integer', minimum: 0, example: 15 },
      hasNextPage: { type: 'boolean', example: true },
      hasPreviousPage: { type: 'boolean', example: false },
    },
  },
  PaginationMeta: {
    oneOf: [
      { $ref: '#/components/schemas/CursorPaginationMeta' },
      { $ref: '#/components/schemas/PagePaginationMeta' },
    ],
  },
  SuccessResponse: {
    type: 'object',
    required: ['success', 'message', 'data'],
    properties: {
      success: { type: 'boolean', enum: [true], example: true },
      message: { type: 'string', example: 'Operation completed successfully' },
      data: { type: 'object', nullable: true, additionalProperties: true },
      error: { type: 'string', nullable: true, example: null },
      timestamp: { type: 'string', format: 'date-time', example: '2026-06-04T18:03:27.000Z' },
    },
  },
  PaginatedResponse: {
    type: 'object',
    required: ['success', 'message', 'data', 'pagination'],
    properties: {
      success: { type: 'boolean', enum: [true], example: true },
      message: { type: 'string', example: 'Records fetched successfully' },
      data: {
        type: 'array',
        items: {},
      },
      pagination: { $ref: '#/components/schemas/PaginationMeta' },
      timestamp: { type: 'string', format: 'date-time', example: '2026-06-04T18:03:27.000Z' },
    },
  },
  ErrorResponse: {
    type: 'object',
    required: ['success', 'message', 'error'],
    properties: {
      success: { type: 'boolean', enum: [false], example: false },
      status: { type: 'string', enum: ['fail', 'error'], example: 'fail' },
      statusCode: { type: 'integer', example: 400 },
      code: { type: 'string', example: 'VALIDATION_ERROR' },
      message: { type: 'string', example: 'Validation failed' },
      error: { type: 'string', example: 'BadRequestError' },
      errors: {
        type: 'array',
        items: { $ref: '#/components/schemas/ErrorDetail' },
      },
      timestamp: { type: 'string', format: 'date-time', example: '2026-06-04T18:03:27.000Z' },
    },
  },
  ValidationErrorResponse: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Validation failed' },
          code: { type: 'string', enum: ['VALIDATION_ERROR'], example: 'VALIDATION_ERROR' },
        },
      },
    ],
  },
  HealthResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              service: { type: 'string', example: 'auth-service' },
              status: { type: 'string', example: 'UP' },
            },
          },
        },
      },
    ],
  },
};

const commonResponses = {
  ValidationError: {
    description: 'Validation error',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
      },
    },
  },
  Unauthorized: {
    description: 'Authentication required or token invalid',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
      },
    },
  },
  Forbidden: {
    description: 'Authenticated principal is not allowed to access this resource',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
      },
    },
  },
  NotFound: {
    description: 'Resource not found',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
      },
    },
  },
  Conflict: {
    description: 'Duplicate resource or state conflict',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
      },
    },
  },
  RateLimited: {
    description: 'Rate limit exceeded',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
      },
    },
  },
  InternalServerError: {
    description: 'Unexpected server error',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
      },
    },
  },
  ServiceUnavailable: {
    description: 'Downstream service unavailable',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
      },
    },
  },
};

function getCommonOpenApiComponents() {
  return {
    schemas: commonSchemas,
    responses: commonResponses,
  };
}

function mergeCommonOpenApiComponents(spec = {}) {
  const components = getCommonOpenApiComponents();
  spec.components = spec.components || {};
  spec.components.schemas = {
    ...components.schemas,
    ...(spec.components.schemas || {}),
  };
  spec.components.responses = {
    ...components.responses,
    ...(spec.components.responses || {}),
  };
  return spec;
}

function ensureJsonSchema(response, schema) {
  response.content = response.content || {};
  response.content['application/json'] = response.content['application/json'] || {};
  response.content['application/json'].schema = response.content['application/json'].schema || schema;
}

function applyStandardOpenApiResponses(spec = {}) {
  mergeCommonOpenApiComponents(spec);

  for (const pathItem of Object.values(spec.paths || {})) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      const operation = pathItem?.[method];

      if (!operation) {
        continue;
      }

      operation.responses = operation.responses || {};

      for (const status of ['200', '201']) {
        if (operation.responses[status]) {
          ensureJsonSchema(operation.responses[status], { $ref: '#/components/schemas/SuccessResponse' });
        }
      }

      operation.responses['400'] = operation.responses['400'] || { $ref: '#/components/responses/ValidationError' };
      operation.responses['401'] = operation.responses['401'] || { $ref: '#/components/responses/Unauthorized' };
      operation.responses['403'] = operation.responses['403'] || { $ref: '#/components/responses/Forbidden' };
      operation.responses['429'] = operation.responses['429'] || { $ref: '#/components/responses/RateLimited' };
      operation.responses['500'] = operation.responses['500'] || { $ref: '#/components/responses/InternalServerError' };
      operation.responses['503'] = operation.responses['503'] || { $ref: '#/components/responses/ServiceUnavailable' };
    }
  }

  return spec;
}

module.exports = {
  applyStandardOpenApiResponses,
  commonResponses,
  commonSchemas,
  getCommonOpenApiComponents,
  mergeCommonOpenApiComponents,
};
