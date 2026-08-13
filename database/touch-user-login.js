const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function touchLogin() {
  const result = await prisma.user.updateMany({
    where: {
      email: 'ankush@gmail.com'
    },
    data: {
      updatedAt: new Date()
    }
  });

  console.log(`✅ Successfully updated ${result.count} user login timestamp!`);
}

touchLogin()
  .catch((err) => {
    console.error('❌ Error updating timestamp:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
