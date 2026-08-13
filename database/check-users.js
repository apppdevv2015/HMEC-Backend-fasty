const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    include: { role: true, company: true }
  });

  console.log(`Total users in DB: ${users.length}`);
  users.forEach((u, i) => {
    console.log(`${i + 1}. Email: ${u.email} | Role: ${u.role ? u.role.name : 'NO_ROLE'} | Company: ${u.company ? u.company.name : 'NO_COMPANY'}`);
  });
}

checkUsers()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
