const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteEngineerUsers() {
  console.log("Checking database users for Engineers / Thabo / ckevin...");

  const users = await prisma.user.findMany({
    include: { role: true }
  });

  const targetUsers = users.filter((u) => {
    const fn = (u.firstName || u.first_name || "").toLowerCase();
    const ln = (u.lastName || u.last_name || "").toLowerCase();
    const em = (u.email || "").toLowerCase();
    const rName = (u.role?.name || "").toLowerCase();

    return (
      fn.includes("thabo") ||
      ln.includes("thabo") ||
      em.includes("thabo") ||
      fn.includes("ckevin") ||
      ln.includes("ckevin") ||
      em.includes("ckevin") ||
      rName.includes("engineer") ||
      fn.includes("engineer") ||
      ln.includes("engineer")
    );
  });

  console.log(`Found ${targetUsers.length} target engineer/test users to delete.`);

  for (const u of targetUsers) {
    console.log(`Deleting user ID: ${u.id} | Email: ${u.email} | Name: ${u.firstName || u.first_name} ${u.lastName || u.last_name}`);
    try {
      // Delete user
      await prisma.user.delete({
        where: { id: u.id }
      });
      console.log(`✓ Deleted user ${u.email}`);
    } catch (err) {
      console.error(`Failed to delete user ${u.email}:`, err.message);
    }
  }

  console.log("Database user deletion finished!");
}

deleteEngineerUsers()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
