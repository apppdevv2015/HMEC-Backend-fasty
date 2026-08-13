const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPlans() {
  const plans = await prisma.subscriptionPlan.findMany();
  const companies = await prisma.company.findMany();

  console.log(`Total subscription plans in DB: ${plans.length}`);
  plans.forEach((p, i) => {
    console.log(`${i + 1}. ID: ${p.id} | Name: ${p.name || p.plan_name} | Price: ${p.price}`);
  });

  console.log(`\nTotal companies in DB: ${companies.length}`);
}

checkPlans()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
