const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPlansDetails() {
  const plans = await prisma.subscriptionPlan.findMany({
    include: {
      subscriptions: {
        include: {
          company: true
        }
      }
    }
  });

  console.log(`Total subscription plans in DB: ${plans.length}\n`);
  plans.forEach((p, i) => {
    console.log(`${i + 1}. Plan: ${p.planName} | Price: $${p.price} | Machine Limit: ${p.machineLimit} | Active Subscriptions: ${p.subscriptions.length}`);
    p.subscriptions.forEach(sub => {
      console.log(`   └─ Company: ${sub.company ? sub.company.name : 'Unknown'} | Status: ${sub.status}`);
    });
  });
}

checkPlansDetails()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
