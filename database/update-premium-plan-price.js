const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePremiumPlanPrice() {
  console.log("Fetching all subscription plans from database...");

  const plans = await prisma.subscriptionPlan.findMany();

  plans.forEach((p, i) => {
    console.log(`Plan #${i + 1}: ID=${p.id} | Name=${p.name || p.plan_name || p.planName} | Price=${p.price} | MachineLimit=${p.machineLimit || p.machine_limit} | StaffLimit=${p.staffLimit || p.staff_limit}`);
  });

  // Find the 'premium' plan which has price 300 and higher limit (100 machines) than 'pro' (50 machines)
  const premiumPlan = plans.find((p) => {
    const name = String(p.name || p.plan_name || p.planName || "").toLowerCase();
    const machineLimit = Number(p.machineLimit || p.machine_limit || 0);
    return name.includes("premium") || (Number(p.price) === 300 && machineLimit >= 100);
  });

  if (premiumPlan) {
    console.log(`Found Premium Plan to update: ID=${premiumPlan.id}, Current Price=${premiumPlan.price}`);
    const updated = await prisma.subscriptionPlan.update({
      where: { id: premiumPlan.id },
      data: { price: 600 }
    });
    console.log(`✓ Successfully updated Premium Plan price to R 600! ID=${updated.id}, New Price=${updated.price}`);
  } else {
    console.log("Could not find specific Premium plan by name/limit, updating plan with ID matching price 300 and machineLimit=100...");
    for (const p of plans) {
      const name = String(p.name || p.plan_name || p.planName || "").toLowerCase();
      const machineLimit = Number(p.machineLimit || p.machine_limit || 0);
      if (name.includes("premium") || (Number(p.price) === 300 && machineLimit > 50)) {
        const updated = await prisma.subscriptionPlan.update({
          where: { id: p.id },
          data: { price: 600 }
        });
        console.log(`✓ Updated plan ID=${updated.id} to Price R 600!`);
      }
    }
  }

  console.log("\nUpdated Subscription Plans Roster:");
  const finalPlans = await prisma.subscriptionPlan.findMany();
  finalPlans.forEach((p, i) => {
    console.log(`${i + 1}. Name=${p.name || p.plan_name || p.planName} | Price=R ${p.price} | Machines=${p.machineLimit || p.machine_limit} | Staff=${p.staffLimit || p.staff_limit}`);
  });
}

updatePremiumPlanPrice()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
