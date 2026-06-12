const prisma = require('../database/prisma');

async function initSchemas() {
  try {
    await prisma.$transaction([
      prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS public`),
    ]);

    console.log('HME database schema validated successfully');
  } catch (error) {
    console.error('Schema creation failed:', error);
    process.exit(1);
  }
}

module.exports = initSchemas;
