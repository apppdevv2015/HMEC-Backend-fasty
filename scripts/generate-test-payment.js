const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Creating a pending subscription for testing...');
    
    // Find the premium plan
    const plan = await prisma.subscriptionPlan.findFirst({
        where: { planName: 'premium' }
    });
    if (!plan) {
        console.error('❌ Premium plan not found in database. Run npm run seed first.');
        process.exit(1);
    }

    // Find the global company
    const company = await prisma.company.findFirst({
        where: { name: 'HME Global' }
    });
    if (!company) {
        console.error('❌ Company HME Global not found in database. Run npm run seed first.');
        process.exit(1);
    }

    // Find the admin user of HME Global
    const user = await prisma.user.findFirst({
        where: { companyId: company.id }
    });
    const userId = user ? user.id : null;

    const subscriptionId = require('crypto').randomUUID();

    // Create a pending subscription record
    const subscription = await prisma.subscription.create({
        data: {
            id: subscriptionId,
            companyId: company.id,
            userId: userId,
            planId: plan.id,
            status: 'pending',
            paymentStatus: 'PENDING',
            idempotencyKey: 'test-payment-' + Date.now(),
            subscriptionStartDate: new Date(),
            subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
    });

    console.log(`✅ Pending subscription created in database!`);
    console.log(`   ID: ${subscription.id}`);
    console.log(`   Company: ${company.name}`);
    console.log(`   Plan: ${plan.planName}`);

    // Update test_payment.html
    const htmlPath = path.join(__dirname, '..', 'test_payment.html');
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Replace the m_payment_id input value
    const paymentIdRegex = /name="m_payment_id" value="[^"]*"/;
    htmlContent = htmlContent.replace(paymentIdRegex, `name="m_payment_id" value="${subscription.id}"`);

    // Replace the visible Payment ID detail in HTML
    const detailIdRegex = /<span class="label">Payment ID:<\/span> [^<]*/;
    htmlContent = htmlContent.replace(detailIdRegex, `<span class="label">Payment ID:</span> ${subscription.id}`);

    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    console.log(`📝 Updated test_payment.html with the new Payment ID!`);
    console.log(`\n👉 Now open test_payment.html in your browser and click "Pay Now (Sandbox)" to test the flow!`);
}

main()
    .catch(err => {
        console.error('Error:', err);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
