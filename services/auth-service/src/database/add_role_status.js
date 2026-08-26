const prisma = require('./prisma');

async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;');
  console.log('✅ SUCCESS: is_active column added to Role table!');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
