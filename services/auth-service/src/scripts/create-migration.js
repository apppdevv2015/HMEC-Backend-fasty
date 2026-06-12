/**
 * Prisma migration creation wrapper script.
 * Usage: npm run migration:create -- <migration_name>
 */
const { runPrisma } = require("./bootstrap-db");
const { loadEnvironment } = require("../bootstrap/env");

function main() {
  loadEnvironment();
  const args = process.argv.slice(2);
  const name = args[0];

  if (!name) {
    console.error("Error: Migration name is required.");
    console.log("Usage: npm run migration:create -- <migration_name>");
    process.exit(1);
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    console.error("Error: Migration name must be alphanumeric with dashes/underscores.");
    process.exit(1);
  }

  console.log(`Creating migration: ${name}...`);
  try {
    runPrisma(["migrate", "dev", "--create-only", "--name", name]);
    console.log("\nMigration created successfully. Review the generated SQL before deploying.");
  } catch (error) {
    console.error("Failed to create migration:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
