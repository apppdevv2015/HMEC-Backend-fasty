const prisma = require('./src/database/prismaClient');

async function seed() {
    const companyId = '00000000-0000-0000-0000-000000000000';
    
    console.log('Starting seed dummy fleet heatmap data...');
    
    // Create 3 dummy machines:
    // 1. A critical Haul Truck (HT)
    // 2. A warning Dozer
    // 3. A healthy Drill
    
    const machinesData = [
        {
            name: 'HME-HT-793D',
            model: 'CAT 793D (Haul Truck)',
            serialNumber: 'SN-HT-793D-999',
            site: 'Kalahari Main Site',
            status: 'Critical',
            costPerHourTarget: 850.00,
            costPerTonTarget: 32.10,
            components: [
                {
                    category: 'Engine',
                    description: 'C175 ACERT Engine',
                    serialNumber: 'SN-ENG-793D-999',
                    supplier: 'CAT OEM Dealer',
                    installHours: 2000,
                    currentHours: 17500,
                    plannedLife: 15000, // end of life
                    replacementCost: 350000.00,
                    condition: 4
                },
                {
                    category: 'Tyre',
                    description: 'Front Left Michelin 59/80R63',
                    serialNumber: 'SN-TYR-FL-999',
                    supplier: 'Michelin Group',
                    installHours: 0,
                    currentHours: 4900,
                    plannedLife: 5000, // critical wear
                    replacementCost: 42000.00,
                    condition: 5
                },
                {
                    category: 'Hydraulic',
                    description: 'Hoist Cylinder Left',
                    serialNumber: 'SN-HYD-HC-999',
                    supplier: 'OEM Hydraulics',
                    installHours: 500,
                    currentHours: 3500,
                    plannedLife: 10000,
                    replacementCost: 18000.00,
                    condition: 2
                },
                {
                    category: 'Transmission',
                    description: 'Power Shift Transmission',
                    serialNumber: 'SN-TRN-PST-999',
                    supplier: 'CAT Reman',
                    installHours: 1200,
                    currentHours: 9800,
                    plannedLife: 12000,
                    replacementCost: 145000.00,
                    condition: 3
                }
            ]
        },
        {
            name: 'HME-DOZ-D11T',
            model: 'CAT D11T (Dozer)',
            serialNumber: 'SN-DOZ-D11T-888',
            site: 'North Pit Wall',
            status: 'Warning',
            costPerHourTarget: 520.00,
            costPerTonTarget: 22.50,
            components: [
                {
                    category: 'Engine',
                    description: 'C32 ACERT engine',
                    serialNumber: 'SN-ENG-D11T-888',
                    supplier: 'CAT OEM',
                    installHours: 1000,
                    currentHours: 8500,
                    plannedLife: 16000,
                    replacementCost: 180000.00,
                    condition: 2
                },
                {
                    category: 'Tyre',
                    description: 'Heavy Duty Steel Tracks Left',
                    serialNumber: 'SN-TRK-L-888',
                    supplier: 'Tractor Attachments',
                    installHours: 0,
                    currentHours: 6800,
                    plannedLife: 8000, // monitor/warning
                    replacementCost: 65000.00,
                    condition: 4
                },
                {
                    category: 'Hydraulic',
                    description: 'Blade Lift Cylinder Left',
                    serialNumber: 'SN-HYD-BC-888',
                    supplier: 'Hydraulic Experts',
                    installHours: 200,
                    currentHours: 1500,
                    plannedLife: 8000,
                    replacementCost: 12500.00,
                    condition: 1
                },
                {
                    category: 'Transmission',
                    description: 'Torque Divider Trans',
                    serialNumber: 'SN-TRN-TDT-888',
                    supplier: 'CAT OEM',
                    installHours: 500,
                    currentHours: 4800,
                    plannedLife: 10000,
                    replacementCost: 85000.00,
                    condition: 2
                }
            ]
        },
        {
            name: 'HME-DRL-MD6250',
            model: 'CAT MD6250 (Drill)',
            serialNumber: 'SN-DRL-MD-777',
            site: 'South East Quarry',
            status: 'Healthy',
            costPerHourTarget: 380.00,
            costPerTonTarget: 12.00,
            components: [
                {
                    category: 'Engine',
                    description: 'C15 Caterpillar Engine',
                    serialNumber: 'SN-ENG-C15-777',
                    supplier: 'CAT Dealer',
                    installHours: 0,
                    currentHours: 1200,
                    plannedLife: 12000,
                    replacementCost: 95000.00,
                    condition: 1
                },
                {
                    category: 'Tyre',
                    description: 'Heavy Duty Crawler Shoes',
                    serialNumber: 'SN-TRK-C-777',
                    supplier: 'OEM Track Co',
                    installHours: 0,
                    currentHours: 800,
                    plannedLife: 6000,
                    replacementCost: 35000.00,
                    condition: 1
                },
                {
                    category: 'Hydraulic',
                    description: 'Rotary Head Motor Hydraulic',
                    serialNumber: 'SN-HYD-RM-777',
                    supplier: 'Rexroth',
                    installHours: 0,
                    currentHours: 950,
                    plannedLife: 8000,
                    replacementCost: 22000.00,
                    condition: 1
                },
                {
                    category: 'Transmission',
                    description: 'Rotary Gearbox Assembly',
                    serialNumber: 'SN-TRN-RGA-777',
                    supplier: 'OEM Parts',
                    installHours: 0,
                    currentHours: 1100,
                    plannedLife: 10000,
                    replacementCost: 45000.00,
                    condition: 2
                }
            ]
        }
    ];
    
    for (const machine of machinesData) {
        // Check if exists
        let dbMachine = await prisma.machine.findUnique({
            where: { serialNumber: machine.serialNumber }
        });
        
        if (dbMachine) {
            console.log(`Machine ${machine.name} already exists, skipping.`);
            continue;
        }
        
        // Create machine
        dbMachine = await prisma.machine.create({
            data: {
                name: machine.name,
                model: machine.model,
                serialNumber: machine.serialNumber,
                companyId,
                site: machine.site,
                status: machine.status,
                costPerHourTarget: machine.costPerHourTarget,
                costPerTonTarget: machine.costPerTonTarget
            }
        });
        
        console.log(`Created Machine: ${dbMachine.name} (UUID: ${dbMachine.id})`);
        
        // Create components
        for (const comp of machine.components) {
            const dbComp = await prisma.component.create({
                data: {
                    machineId: dbMachine.id,
                    category: comp.category,
                    description: comp.description,
                    serialNumber: comp.serialNumber,
                    supplier: comp.supplier,
                    installHours: comp.installHours,
                    currentHours: comp.currentHours,
                    plannedLife: comp.plannedLife,
                    replacementCost: comp.replacementCost,
                    condition: comp.condition
                }
            });
            console.log(`  -> Created Component: ${dbComp.description} (${dbComp.category})`);
        }
    }
    
    console.log('Seeding finished successfully!');
}

seed()
    .catch(err => {
        console.error('Seed error:', err);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
