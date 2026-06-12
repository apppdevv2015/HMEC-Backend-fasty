/**
 * Prisma CLI wrapper script.
 * Usage: node services/auth-service/src/scripts/prisma-cli.js [prisma args...]
 */
const { runPrisma } = require("./bootstrap-db");
const { loadEnvironment } = require("../bootstrap/env");

function main() {
  loadEnvironment();
  const args = process.argv.slice(2);
  try {
    runPrisma(args);
  } catch (error) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
