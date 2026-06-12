const { PrismaClient } = require('@prisma/client');
let prismaInstance = null;

function getLoggingPrisma() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

function setLoggingPrisma(instance) {
  prismaInstance = instance;
}

module.exports = {
  getLoggingPrisma,
  setLoggingPrisma,
};
