const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugPlansAndCompanies() {
  const companies = await prisma.company.findMany({
    include: {
      subscriptions: {
        include: {
          plan: true
        }
      }
    }
  });

  console.log('=== COMPANIES & SUBSCRIPTIONS ===');
  companies.forEach((c) => {
    console.log(`Company: ${c.name} | Code: ${c.companyCode || c.id}`);
    if (c.subscriptions && c.subscriptions.length > 0) {
      c.subscriptions.forEach(s => {
        console.log(`  └─ Subscription: Plan=${s.plan ? s.plan.planName : s.planId} | Status=${s.status}`);
      });
    } else {
      console.log(`  └─ No subscriptions in DB relation`);
    }
  });

  const plans = await prisma.subscriptionPlan.findMany();
  console.log('\n=== PLANS ===');
  plans.forEach(p => console.log(`Plan ID: ${p.id} | Name: ${p.planName} | Price: ${p.price}`));
}

debugPlansAndCompanies()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
