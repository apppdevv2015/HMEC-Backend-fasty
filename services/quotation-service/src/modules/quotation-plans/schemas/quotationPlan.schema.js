/**
 * Fastify Compiled JSON Schemas (Ajv Validation) for Quotation Plans
 */

const idParamSchema = {
    type: 'object',
    required: ['id'],
    properties: {
        id: {
            type: 'string',
            minLength: 1
        }
    }
};

const createQuotationPlanSchema = {
    body: {
        type: 'object',
        required: ['name'],
        properties: {
            name: {
                type: 'string',
                minLength: 2,
                maxLength: 120
            },
            tierCode: {
                type: 'string',
                maxLength: 50
            },
            minMachines: {
                type: 'integer',
                minimum: 1
            },
            maxMachines: {
                type: 'integer',
                minimum: 1
            },
            monthlyPrice: {
                type: 'number',
                minimum: 0
            },
            currency: {
                type: 'string',
                default: 'ZAR'
            },
            durationOptions: {
                type: 'array',
                items: { type: 'integer' }
            },
            isTrial: {
                type: 'boolean',
                default: false
            },
            trialDays: {
                type: 'integer',
                minimum: 1
            },
            isCustom: {
                type: 'boolean',
                default: false
            },
            features: {
                type: 'array',
                items: { type: 'string' }
            },
            sortOrder: {
                type: 'integer',
                minimum: 0
            },
            isActive: {
                type: 'boolean',
                default: true
            }
        },
        additionalProperties: true
    }
};

const updateQuotationPlanSchema = {
    params: idParamSchema,
    body: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                minLength: 2,
                maxLength: 120
            },
            tierCode: {
                type: 'string',
                maxLength: 50
            },
            minMachines: {
                type: 'integer',
                minimum: 1
            },
            maxMachines: {
                type: 'integer',
                minimum: 1
            },
            monthlyPrice: {
                type: 'number',
                minimum: 0
            },
            currency: {
                type: 'string'
            },
            durationOptions: {
                type: 'array',
                items: { type: 'integer' }
            },
            isTrial: {
                type: 'boolean'
            },
            trialDays: {
                type: 'integer',
                minimum: 1
            },
            isCustom: {
                type: 'boolean'
            },
            features: {
                type: 'array',
                items: { type: 'string' }
            },
            sortOrder: {
                type: 'integer',
                minimum: 0
            },
            isActive: {
                type: 'boolean'
            }
        },
        additionalProperties: true
    }
};

module.exports = {
    idParamSchema,
    createQuotationPlanSchema,
    updateQuotationPlanSchema
};
