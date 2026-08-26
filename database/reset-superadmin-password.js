const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPasswords() {
  console.log('🔄 Resetting superadmin and key user passwords...');

  const superHash = await bcrypt.hash('HME@super2026', 10);
  const adminHash = await bcrypt.hash('HME@admin2026', 10);
  const defaultAdminHash = await bcrypt.hash('admin', 10);

  // Update superadmin@hme.com
  const superAdmin = await prisma.user.updateMany({
    where: { email: 'superadmin@hme.com' },
    data: { password: superHash, isActive: true }
  });
  console.log(`✅ Updated ${superAdmin.count} superadmin user(s) password to "HME@super2026"`);

  // Update support@hme.com and support@gmail.com
  const supportUsers = await prisma.user.updateMany({
    where: { email: { in: ['support@hme.com', 'support@gmail.com'] } },
    data: { password: superHash, isActive: true }
  });
  console.log(`✅ Updated ${supportUsers.count} support user(s) password to "HME@super2026"`);

  // Update admin@hme.com
  const adminSys = await prisma.user.updateMany({
    where: { email: 'admin@hme.com' },
    data: { password: adminHash, isActive: true }
  });
  console.log(`✅ Updated ${adminSys.count} admin user(s) password to "HME@admin2026"`);

  // Update admin@gmail.com
  const adminGlobal = await prisma.user.updateMany({
    where: { email: 'admin@gmail.com' },
    data: { password: defaultAdminHash, isActive: true }
  });
  console.log(`✅ Updated ${adminGlobal.count} admin@gmail.com user(s) password to "admin"`);
}

resetPasswords()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
