const bcrypt = require('bcryptjs');
const prisma = require('../database/prisma');

async function ensureRoles() {
  const roles = ['super_admin', 'sub_super_admin', 'admin', 'sub_admin', 'engineer', 'planner', 'viewer'];

  await prisma.$transaction(async (tx) => {
    // Advisory lock using HME namespace
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('hme_seed_roles'))`;

    for (const roleName of roles) {
      const existingRole = await tx.role.findUnique({
        where: { name: roleName },
      });

      if (existingRole) {
        continue;
      }

      await tx.role.create({
        data: { name: roleName },
      });
    }
  });
}

async function ensureSuperAdmin() {
  const email = (process.env.SUPERADMIN_EMAIL || 'superadmin@hme.com').trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD || 'HME@super2026';

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return;
  }

  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'super_admin' },
  });

  if (!superAdminRole) {
    throw new Error('Superadmin role could not be seeded.');
  }

  // Ensure default company exists
  let company = await prisma.company.findUnique({
    where: { id: '00000000-0000-0000-0000-000000000000' },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'HME Systems',
        subscriptionStatus: 'active',
      },
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      roleId: superAdminRole.id,
      firstName: process.env.SUPERADMIN_FIRST_NAME || 'Super',
      lastName: process.env.SUPERADMIN_LAST_NAME || 'Admin',
      email,
      password: hashedPassword,
      companyId: company.id,
      isActive: true,
    },
  });
}

async function seedAuthData() {
  await ensureRoles();
  await ensureSuperAdmin();
}

module.exports = {
  seedAuthData,
};
