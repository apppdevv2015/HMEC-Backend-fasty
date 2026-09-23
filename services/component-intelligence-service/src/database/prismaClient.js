const { PrismaClient } = require('../../../../node_modules/.prisma-clients/intelligence-client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

module.exports = prisma;
