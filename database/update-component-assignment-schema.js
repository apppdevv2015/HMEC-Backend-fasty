const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Checking and updating PostgreSQL database schema for Component Artisan Assignments...");

  try {
    // Execute SQL raw queries to safely add columns if they don't exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Component" 
      ADD COLUMN IF NOT EXISTS "assigned_start_date" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "assigned_due_date" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "assigned_work_scope" TEXT,
      ADD COLUMN IF NOT EXISTS "assigned_priority" VARCHAR(50);
    `);

    console.log("✓ Successfully added assigned_start_date, assigned_due_date, assigned_work_scope, and assigned_priority columns to PostgreSQL Component table!");

    // Also update Machine table for operator start and due dates
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Machine" 
      ADD COLUMN IF NOT EXISTS "assigned_start_date" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "assigned_due_date" TIMESTAMP;
    `);

    console.log("✓ Successfully updated Machine table schema in PostgreSQL DB!");
  } catch (err) {
    console.error("Database migration error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
