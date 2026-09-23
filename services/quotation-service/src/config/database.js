const { PrismaClient } = require('../../../../node_modules/.prisma-clients/quotation-client');
require('dotenv').config();

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
});

module.exports = prisma;
