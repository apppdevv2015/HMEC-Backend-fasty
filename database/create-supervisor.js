const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSupervisor() {
  const args = process.argv.slice(2);
  
  // Parse CLI args if provided, e.g. node create-supervisor.js --email=sup@hme.com --password=Pass123 --firstName=John --lastName=Doe
  let email = 'supervisor@hme.com';
  let rawPassword = 'HME@supervisor2026';
  let firstName = 'Sarah';
  let lastName = 'Supervisor';
  let mobileNumber = '9876543210';
  let companyName = 'HME Systems';

  args.forEach(arg => {
    if (arg.startsWith('--email=')) email = arg.split('=')[1];
    if (arg.startsWith('--password=')) rawPassword = arg.split('=')[1];
    if (arg.startsWith('--firstName=')) firstName = arg.split('=')[1];
    if (arg.startsWith('--lastName=')) lastName = arg.split('=')[1];
    if (arg.startsWith('--mobile=')) mobileNumber = arg.split('=')[1];
    if (arg.startsWith('--company=')) companyName = arg.split('=')[1];
  });

  console.log(`🔄 Creating/Updating Supervisor user (${email})...`);

  // 1. Get or create supervisor role
  let role = await prisma.role.findUnique({ where: { name: 'supervisor' } });
  if (!role) {
    role = await prisma.role.create({ data: { name: 'supervisor' } });
  }

  // 2. Get or create target company
  let company = await prisma.company.findFirst({ where: { name: companyName } });
  if (!company) {
    company = await prisma.company.findFirst();
  }

  if (!company) {
    console.error('❌ No company found in database. Please run database seed first.');
    process.exit(1);
  }

  // 3. Hash password
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  // 4. Create or update supervisor user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      firstName,
      lastName,
      mobileNumber,
      roleId: role.id,
      companyId: company.id,
      isActive: true,
    },
    create: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      mobileNumber,
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
  console.log('✅ SUPERVISOR USER CREATED / UPDATED!');
  console.log('========================================');
  console.log(`📌 Email:      ${user.email}`);
  console.log(`🔑 Password:   ${rawPassword}`);
  console.log(`👤 Name:       ${user.firstName} ${user.lastName || ''}`);
  console.log(`🏢 Company:    ${user.company.name}`);
  console.log(`🛡️ Role:       ${user.role.name}`);
  console.log('========================================\n');
}

createSupervisor()
  .catch((e) => {
    console.error('❌ Error creating supervisor:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
