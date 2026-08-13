const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAdmins() {
  const result = await prisma.user.updateMany({
    where: {
      email: {
        in: ['admin@hme.com', 'admin@gmail.com']
      }
    },
    data: {
      firstName: 'Company',
      lastName: 'Admin'
    }
  });

  console.log(`✅ Successfully updated ${result.count} admin user(s) to "Company Admin"!`);
}

updateAdmins()
  .catch((err) => {
    console.error('❌ Error updating admin users:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
