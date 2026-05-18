const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Activating premium subscription for default system company...');

  // 1. Find the premium plan
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { planName: 'premium' }
  });

  if (!plan) {
    console.error('❌ "premium" subscription plan not found. Run seed-prisma first.');
    process.exit(1);
  }

  // 2. Create or Update active subscription for the default system company
  const companyId = '00000000-0000-0000-0000-000000000000';
  
  const subscription = await prisma.subscription.upsert({
    where: {
      idempotencyKey: 'default-system-premium-sub'
    },
    update: {
      companyId: companyId,
      planId: plan.id,
      status: 'active',
      paymentStatus: 'PAID',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year validity
    },
    create: {
      companyId: companyId,
      planId: plan.id,
      status: 'active',
      paymentStatus: 'PAID',
      idempotencyKey: 'default-system-premium-sub',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year validity
    }
  });

  console.log('✅ Premium subscription successfully activated for HME Systems!');
  console.log(subscription);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
