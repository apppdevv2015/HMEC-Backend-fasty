const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSubSuperAdmin() {
  console.log('🔄 Creating default Sub Super Admin user...');

  // 1. Get or create sub_super_admin role
  let role = await prisma.role.findUnique({ where: { name: 'sub_super_admin' } });
  if (!role) {
    role = await prisma.role.create({ data: { name: 'sub_super_admin' } });
  }

  // 2. Get system company
  let company = await prisma.company.findFirst({ where: { name: 'HME Systems' } });
  if (!company) {
    company = await prisma.company.findFirst();
  }

  const hashedPassword = await bcrypt.hash('HME@subsuper2026', 10);

  const user = await prisma.user.upsert({
    where: { email: 'subsuperadmin@hme.com' },
    update: {
      password: hashedPassword,
      firstName: 'Sub Super',
      lastName: 'Admin',
      roleId: role.id,
      companyId: company.id,
      isActive: true,
    },
    create: {
      email: 'subsuperadmin@hme.com',
      password: hashedPassword,
      firstName: 'Sub Super',
      lastName: 'Admin',
      roleId: role.id,
      companyId: company.id,
      isActive: true,
    },
    include: {
      role: true,
      company: true,
    },
  });

  console.log('\n========================================');
  console.log('✅ SUB SUPER ADMIN CREATED!');
  console.log('========================================');
  console.log(`📌 Email:    ${user.email}`);
  console.log(`🔑 Password: HME@subsuper2026`);
  console.log(`👤 Name:     ${user.firstName} ${user.lastName}`);
  console.log(`🛡️ Role:     ${user.role.name}`);
  console.log('========================================\n');
}

createSubSuperAdmin()
  .catch((e) => {
    console.error('❌ Error creating sub super admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
