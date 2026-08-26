const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAdmins() {
  const admin1 = await prisma.user.findUnique({
    where: { email: 'admin@hme.com' },
    include: { role: true, company: true }
  });

  const admin2 = await prisma.user.findUnique({
    where: { email: 'admin@gmail.com' },
    include: { role: true, company: true }
  });

  const p1Match = await bcrypt.compare('HME@admin2026', admin1.password);
  const p2Match = await bcrypt.compare('admin', admin2.password);

  console.log('=== ADMIN 1 ===');
  console.log('Email:', admin1.email);
  console.log('Role:', admin1.role.name);
  console.log('Is Active:', admin1.isActive);
  console.log('Company:', admin1.company.name);
  console.log('Password Valid (HME@admin2026):', p1Match);

  console.log('\n=== ADMIN 2 ===');
  console.log('Email:', admin2.email);
  console.log('Role:', admin2.role.name);
  console.log('Is Active:', admin2.isActive);
  console.log('Company:', admin2.company.name);
  console.log('Password Valid (admin):', p2Match);
}

testAdmins()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
