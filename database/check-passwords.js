const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { role: true }
  });

  const passwordsToTest = [
    'HME@super2026',
    'Password123!',
    'HME@subsuper2026',
    'HME@admin2026',
    'admin',
    'superadmin',
    'password',
    'admin123',
    'Pass123',
    'Pass123!',
    'Password123',
    '123456',
    '12345678',
    'support',
    'HME@support2026'
  ];

  for (const user of users) {
    console.log(`\nUser: ${user.email} | Role: ${user.role?.name}`);
    let matched = false;
    for (const p of passwordsToTest) {
      if (await bcrypt.compare(p, user.password)) {
        console.log(`  MATCHED PASSWORD: "${p}"`);
        matched = true;
        break;
      }
    }
    if (!matched) {
      console.log(`  No password match in test list`);
    }
  }
}

main().finally(() => prisma.$disconnect());
