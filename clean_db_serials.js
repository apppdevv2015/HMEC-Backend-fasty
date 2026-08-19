const prisma = require('./services/component-intelligence-service/src/database/prismaClient');

async function cleanSerialNumbers() {
  console.log('--- Cleaning DB Serial Numbers ---');
  try {
    const machines = await prisma.machine.findMany();
    console.log(`Found ${machines.length} machines`);
    for (const m of machines) {
      if (m.serialNumber && m.serialNumber.toLowerCase().includes('demo-')) {
        const cleanSn = m.serialNumber.replace(/^DEMO-/i, '');
        await prisma.machine.update({
          where: { id: m.id },
          data: { serialNumber: cleanSn }
        });
        console.log(`Updated Machine ${m.name}: ${m.serialNumber} -> ${cleanSn}`);
      }
    }

    const components = await prisma.component.findMany();
    console.log(`Found ${components.length} components`);
    for (const c of components) {
      if (c.serialNumber && c.serialNumber.toLowerCase().includes('demo-')) {
        const cleanSn = c.serialNumber.replace(/^DEMO-/i, '');
        await prisma.component.update({
          where: { id: c.id },
          data: { serialNumber: cleanSn }
        });
        console.log(`Updated Component ${c.id}: ${c.serialNumber} -> ${cleanSn}`);
      }
    }
    console.log('--- DB Cleaning Complete! ---');
  } catch (err) {
    console.error('Error cleaning database serial numbers:', err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanSerialNumbers();
