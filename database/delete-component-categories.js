const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking Component Categories in database...");

  const categories = await prisma.componentCategory.findMany();
  console.log(`Found ${categories.length} component categories in database.`);

  if (categories.length === 0) {
    console.log("No component categories found to delete.");
    return;
  }

  console.log("Nullifying categoryId references in components table...");
  await prisma.component.updateMany({
    where: { categoryId: { not: null } },
    data: { categoryId: null }
  });

  console.log("Deleting all component categories...");
  const deleteResult = await prisma.componentCategory.deleteMany({});
  console.log(`Successfully deleted ${deleteResult.count} component category records from database!`);
}

main()
  .catch((err) => {
    console.error("Error deleting component categories:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
