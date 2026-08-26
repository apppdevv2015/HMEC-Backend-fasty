const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
});

module.exports = prisma;
