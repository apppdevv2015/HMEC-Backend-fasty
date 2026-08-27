/**
 * optionalService.schema.js
 * Fastify Built-in JSON Schema (Ajv) definitions for Optional Service Catalog API
 */

const idParamSchema = {
    type: 'object',
    properties: {
        id: { 
            type: 'string', 
            format: 'uuid',
            description: 'UUID identifier of the optional service' 
        }
    },
    required: ['id']
};

const getOptionalServicesQuerySchema = {
    type: 'object',
    properties: {
        search: { type: 'string', maxLength: 100 },
        isActive: { type: ['boolean', 'string'] },
        page: { type: ['integer', 'string'], minimum: 1, default: 1 },
        limit: { type: ['integer', 'string'], default: 10 }
    },
    additionalProperties: false
};

const createOptionalServiceSchema = {
    type: 'object',
    required: ['name'],
    properties: {
        name: { 
            type: 'string', 
            minLength: 2, 
            maxLength: 150, 
            description: 'Service name' 
        },
        description: { 
            type: ['string', 'null'], 
            maxLength: 1000, 
            description: 'Service description' 
        },
        isActive: { 
            type: 'boolean', 
            default: true, 
            description: 'Activation status' 
        },
        sortOrder: { 
            type: 'integer', 
            minimum: 0, 
            default: 0, 
            description: 'Display order index' 
        }
    },
    additionalProperties: true
};

const updateOptionalServiceSchema = {
    type: 'object',
    properties: {
        name: { 
            type: 'string', 
            minLength: 2, 
            maxLength: 150 
        },
        description: { 
            type: ['string', 'null'], 
            maxLength: 1000 
        },
        isActive: { 
            type: 'boolean' 
        },
        sortOrder: { 
            type: 'integer', 
            minimum: 0 
        }
    },
    additionalProperties: true
};

module.exports = {
    idParamSchema,
    getOptionalServicesQuerySchema,
    createOptionalServiceSchema,
    updateOptionalServiceSchema
};
