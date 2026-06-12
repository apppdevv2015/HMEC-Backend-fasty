const swaggerJSDoc = require('swagger-jsdoc');
const { applyStandardOpenApiResponses, mergeCommonOpenApiComponents } = require('../runtime');

const definition = mergeCommonOpenApiComponents({
  openapi: '3.0.4',
  info: {
    title: 'HME Authentication & User Service API',
    version: '1.0.0',
    description: 'Operational APIs for company onboarding, user profiles, authentication, and subscriptions',
  },
  tags: [
    {
      name: 'Authentication',
      description: 'Company onboarding, logins, and token validation',
    },
    {
      name: 'Companies',
      description: 'Company profiles and subscription settings',
    },
    {
      name: 'Users',
      description: 'Ecosystem and company user management',
    },
    {
      name: 'Plans',
      description: 'Subscription plans and pricing details',
    },
  ],
  servers: [
    {
      url: '/api/v1',
      description: 'Current host direct service base',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      CompanySignupDto: {
        type: 'object',
        required: [
          'companyName',
          'adminFirstName',
          'adminLastName',
          'adminEmail',
          'password',
        ],
        properties: {
          companyName: { type: 'string', example: 'HME Global' },
          companyCode: { type: 'string', example: 'HME-GLOBAL-01' },
          adminFirstName: { type: 'string', example: 'Asha' },
          adminLastName: { type: 'string', example: 'Sharma' },
          adminEmail: { type: 'string', format: 'email', example: 'admin@gmail.com' },
          password: { type: 'string', format: 'password', example: 'password123' },
        },
      },
      LoginDto: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@gmail.com' },
          password: { type: 'string', format: 'password', example: 'password123' },
        },
      },
      CreateUserDto: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password', 'role'],
        properties: {
          firstName: { type: 'string', example: 'Komal' },
          lastName: { type: 'string', example: 'Sharma' },
          email: { type: 'string', format: 'email', example: 'engineer@hme.com' },
          password: { type: 'string', format: 'password', example: 'password123' },
          role: {
            type: 'string',
            enum: ['super_admin', 'admin', 'engineer', 'planner', 'viewer'],
            example: 'engineer',
          },
          companyId: { type: 'string', format: 'uuid' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '9c9f7f7a-3b1f-4c61-9f6b-5f0f9e6e9a10' },
          firstName: { type: 'string', example: 'Komal' },
          lastName: { type: 'string', example: 'Sharma' },
          email: { type: 'string', format: 'email', example: 'engineer@hme.com' },
          companyId: { type: 'string', format: 'uuid', example: '00000000-0000-0000-0000-000000000000' },
          roleId: { type: 'string', format: 'uuid' },
          isActive: { type: 'boolean', example: true },
        },
      },
      SubscriptionPlan: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          planName: { type: 'string', example: 'premium' },
          price: { type: 'number', example: 300 },
          machineLimit: { type: 'integer', example: 100 },
          staffLimit: { type: 'integer', example: 100 },
          validityDays: { type: 'integer', example: 30 },
          isPublic: { type: 'boolean', example: true },
          isActive: { type: 'boolean', example: true },
        },
      },
      Company: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'HME Systems' },
          companyCode: { type: 'string', example: 'HME-000001' },
          subscriptionStatus: { type: 'string', example: 'active' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
});

const options = {
  definition,
  apis: [
    './src/routes/*.js',
    './src/modules/**/routes/*.js',
  ],
};

module.exports = applyStandardOpenApiResponses(swaggerJSDoc(options));
