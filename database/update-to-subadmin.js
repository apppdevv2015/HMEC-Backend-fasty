const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateToSubAdmin() {
  console.log('🔄 Changing admin@gmail.com role to sub_admin...');

  // 1. Get or create sub_admin role
  let subAdminRole = await prisma.role.findUnique({
    where: { name: 'sub_admin' }
  });

  if (!subAdminRole) {
    console.log('Creating sub_admin role in database...');
    subAdminRole = await prisma.role.create({
      data: { name: 'sub_admin' }
    });
  }

  // 2. Update admin@gmail.com role to sub_admin
  const updatedUser = await prisma.user.update({
    where: { email: 'admin@gmail.com' },
    data: {
      roleId: subAdminRole.id,
      firstName: 'Sub',
      lastName: 'Admin'
    },
    include: { role: true, company: true }
  });

  console.log(`✅ Updated ${updatedUser.email} to role: "${updatedUser.role.name}"`);

  // 3. Verify remaining Company Admin users
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  const remainingAdmins = await prisma.user.findMany({
    where: { roleId: adminRole.id },
    select: { email: true, firstName: true, lastName: true, company: { select: { name: true } } }
  });

  console.log(`\n📌 Remaining Company Admin(s) count: ${remainingAdmins.length}`);
  remainingAdmins.forEach(a => console.log(` - ${a.email} (${a.firstName} ${a.lastName}) | Company: ${a.company.name}`));
}

updateToSubAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
