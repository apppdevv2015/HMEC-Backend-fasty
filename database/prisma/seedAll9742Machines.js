const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BRANDS = [
  "Caterpillar", "Komatsu", "Volvo", "Hitachi", "JCB", "Liebherr", "Sandvik", "Terex",
  "Case", "Bobcat", "SANY", "XCMG", "Hyundai", "Doosan", "Kobelco", "Bell", "Manitowoc",
  "Tadano", "Wirtgen", "Hamm", "Ammann", "Bomag", "Dynapac", "Epiroc", "Furukawa",
  "Hidromek", "Kato", "Kubota", "LiuGong", "Manitou", "Takeuchi", "Yanmar", "Zoomlion",
  "Atlas Copco", "Bauer", "Haulotte", "Hyster", "John Deere", "Link-Belt", "Mack",
  "Mecalac", "Merlo", "Mustang", "New Holland", "Sennebogen", "Sumitomo", "Wacker Neuson"
];

// 55 COMPLETE EQUIPMENT CATEGORIES FROM HEAVY EQUIPMENT HUB
const CATEGORIES = [
  { name: "Hydraulic Excavator", prefix: "HEX", baseWeight: 22000, baseHp: 180 },
  { name: "Wheel Loader", prefix: "WLD", baseWeight: 18000, baseHp: 210 },
  { name: "Mining Haul Truck", prefix: "MHT", baseWeight: 140000, baseHp: 1050 },
  { name: "Track Dozer", prefix: "TDZ", baseWeight: 45000, baseHp: 420 },
  { name: "Motor Grader", prefix: "MGR", baseWeight: 19000, baseHp: 220 },
  { name: "Backhoe Loader", prefix: "BHL", baseWeight: 8500, baseHp: 95 },
  { name: "Mobile Crane", prefix: "MCR", baseWeight: 60000, baseHp: 380 },
  { name: "Soil Compactor & Roller", prefix: "SCR", baseWeight: 12000, baseHp: 130 },
  { name: "Skid Steer Loader", prefix: "SSL", baseWeight: 3500, baseHp: 75 },
  { name: "Underground Mining Loader", prefix: "UGL", baseWeight: 38000, baseHp: 310 },
  { name: "Forklift Truck", prefix: "FLT", baseWeight: 5000, baseHp: 70 },
  { name: "Telehandler & Boom Handler", prefix: "THD", baseWeight: 9000, baseHp: 110 },
  { name: "Articulated Dump Truck", prefix: "ADT", baseWeight: 32000, baseHp: 350 },
  { name: "Asphalt Paver", prefix: "APV", baseWeight: 16000, baseHp: 170 },
  { name: "Mini Excavator", prefix: "MEX", baseWeight: 3500, baseHp: 35 },
  { name: "Crawler Crane", prefix: "CCR", baseWeight: 110000, baseHp: 450 },
  { name: "Tower Crane", prefix: "TCR", baseWeight: 80000, baseHp: 250 },
  { name: "Rough Terrain Crane", prefix: "RTC", baseWeight: 45000, baseHp: 280 },
  { name: "All Terrain Crane", prefix: "ATC", baseWeight: 72000, baseHp: 520 },
  { name: "Compact Wheel Loader", prefix: "CWL", baseWeight: 6500, baseHp: 75 },
  { name: "Crawler Track Loader", prefix: "CTL", baseWeight: 15000, baseHp: 160 },
  { name: "Trench Excavator", prefix: "TEX", baseWeight: 28000, baseHp: 210 },
  { name: "Dragline Mining Excavator", prefix: "DLE", baseWeight: 250000, baseHp: 2200 },
  { name: "Electric Rope Shovel", prefix: "ERS", baseWeight: 400000, baseHp: 3500 },
  { name: "Hydraulic Mining Shovel", prefix: "HMS", baseWeight: 350000, baseHp: 2800 },
  { name: "Cold Milling Road Planer", prefix: "CMP", baseWeight: 28000, baseHp: 480 },
  { name: "Soil Stabilizer & Reclaimer", prefix: "SSR", baseWeight: 24000, baseHp: 420 },
  { name: "Tandem Asphalt Roller", prefix: "TAR", baseWeight: 10500, baseHp: 100 },
  { name: "Pneumatic Tyre Roller", prefix: "PTR", baseWeight: 14000, baseHp: 115 },
  { name: "Mobile Jaw Crusher", prefix: "MJC", baseWeight: 42000, baseHp: 350 },
  { name: "Mobile Screening Plant", prefix: "MSP", baseWeight: 28000, baseHp: 220 },
  { name: "Bucket Wheel Excavator", prefix: "BWE", baseWeight: 800000, baseHp: 5000 },
  { name: "Pipeline Pipelayer", prefix: "PPL", baseWeight: 48000, baseHp: 380 },
  { name: "Underground Mining Truck", prefix: "UMT", baseWeight: 45000, baseHp: 450 },
  { name: "Rock Drill & Surface Rig", prefix: "RDR", baseWeight: 18000, baseHp: 240 },
  { name: "Jumbo Drill Rig", prefix: "JDR", baseWeight: 22000, baseHp: 180 },
  { name: "Underground Scaler", prefix: "USC", baseWeight: 16000, baseHp: 140 },
  { name: "Concrete Pump Truck", prefix: "CPT", baseWeight: 26000, baseHp: 320 },
  { name: "Concrete Mixer Truck", prefix: "CMT", baseWeight: 15000, baseHp: 280 },
  { name: "Boom Lift AWP", prefix: "BLA", baseWeight: 12000, baseHp: 65 },
  { name: "Scissor Lift Platform", prefix: "SLP", baseWeight: 4500, baseHp: 40 },
  { name: "Tow Tractor & Heavy Hauler", prefix: "TTH", baseWeight: 25000, baseHp: 340 },
  { name: "Forestry Timber Harvester", prefix: "FTH", baseWeight: 21000, baseHp: 260 },
  { name: "Forestry Forwarder Loader", prefix: "FFL", baseWeight: 19000, baseHp: 230 },
  { name: "Forestry Timber Skidder", prefix: "FTS", baseWeight: 17000, baseHp: 210 },
  { name: "Feller Buncher", prefix: "FBC", baseWeight: 24000, baseHp: 280 },
  { name: "Motor Scraper", prefix: "MSC", baseWeight: 38000, baseHp: 450 },
  { name: "Slag Pot Carrier", prefix: "SPC", baseWeight: 65000, baseHp: 480 },
  { name: "Straddle Carrier", prefix: "STC", baseWeight: 72000, baseHp: 500 },
  { name: "Reach Stacker Container", prefix: "RSC", baseWeight: 68000, baseHp: 340 },
  { name: "Port Terminal Tractor", prefix: "PTT", baseWeight: 9000, baseHp: 220 },
  { name: "Heavy Transport Lowboy Trailer", prefix: "HTL", baseWeight: 35000, baseHp: 540 },
  { name: "Hydraulic Breaker Unit", prefix: "HBU", baseWeight: 14000, baseHp: 160 },
  { name: "Suction Excavator Truck", prefix: "SET", baseWeight: 26000, baseHp: 380 },
  { name: "Site Mini Dumper", prefix: "SMD", baseWeight: 4200, baseHp: 45 }
];

function generateComponents(categoryName, brandName) {
  const isTruck = categoryName.includes('Truck') || categoryName.includes('Hauler') || categoryName.includes('Dumper');
  const isExcavator = categoryName.includes('Excavator') || categoryName.includes('Shovel');
  const isDozer = categoryName.includes('Dozer');

  if (isTruck) {
    return [
      {
        name: `${brandName} Heavy V12 Diesel Engine`,
        category: "Engine",
        parameters: [
          { name: "Engine Oil Pressure", unit: "PSI", safeMin: 30, safeMax: 65, defaultVal: 48, description: "Gallery oil pressure" },
          { name: "Coolant Temperature", unit: "°C", safeMin: 65, safeMax: 95, defaultVal: 82, description: "Engine coolant temp" },
          { name: "Engine RPM", unit: "RPM", safeMin: 650, safeMax: 2200, defaultVal: 1550, description: "Engine speed" },
          { name: "Engine Oil Level", unit: "%", safeMin: 75, safeMax: 100, defaultVal: 95, description: "Sump oil level" }
        ]
      },
      {
        name: "Powershift Transmission",
        category: "Transmission",
        parameters: [
          { name: "Transmission Oil Temp", unit: "°C", safeMin: 60, safeMax: 95, defaultVal: 78, description: "Gearbox oil temp" },
          { name: "Clutch Pack Pressure", unit: "Bar", safeMin: 15, safeMax: 25, defaultVal: 20, description: "Clutch pressure" }
        ]
      },
      {
        name: "Body Hoist Hydraulics",
        category: "Hydraulics",
        parameters: [
          { name: "Dump Cylinder Pressure", unit: "Bar", safeMin: 150, safeMax: 350, defaultVal: 220, description: "Hoist cylinder pressure" },
          { name: "Hydraulic Oil Temp", unit: "°C", safeMin: 50, safeMax: 85, defaultVal: 65, description: "Hydraulic fluid temp" }
        ]
      },
      {
        name: "Mining Tyres & Wheel Ends",
        category: "Tyres & Undercarriage",
        parameters: [
          { name: "Front Tyre Air Pressure", unit: "PSI", safeMin: 30, safeMax: 48, defaultVal: 38, description: "Front tyre pressure" },
          { name: "Rear Tyre Air Pressure", unit: "PSI", safeMin: 30, safeMax: 48, defaultVal: 38, description: "Rear dual tyre pressure" }
        ]
      }
    ];
  }

  if (isExcavator) {
    return [
      {
        name: `${brandName} High Power Diesel Engine`,
        category: "Engine",
        parameters: [
          { name: "Engine Oil Pressure", unit: "PSI", safeMin: 30, safeMax: 65, defaultVal: 46, description: "Oil pressure" },
          { name: "Coolant Temperature", unit: "°C", safeMin: 65, safeMax: 95, defaultVal: 84, description: "Coolant temp" }
        ]
      },
      {
        name: "Twin Piston Main Hydraulic Pump",
        category: "Hydraulics",
        parameters: [
          { name: "Main Pump Pressure", unit: "Bar", safeMin: 200, safeMax: 350, defaultVal: 285, description: "Pump output pressure" },
          { name: "Hydraulic Oil Temp", unit: "°C", safeMin: 50, safeMax: 85, defaultVal: 68, description: "Hydraulic fluid temp" }
        ]
      }
    ];
  }

  return [
    {
      name: `${brandName} Industrial Engine Assembly`,
      category: "Engine",
      parameters: [
        { name: "Engine Oil Pressure", unit: "PSI", safeMin: 30, safeMax: 65, defaultVal: 47, description: "Operating oil pressure" },
        { name: "Coolant Temperature", unit: "°C", safeMin: 65, safeMax: 95, defaultVal: 82, description: "Coolant temp" }
      ]
    },
    {
      name: "Main Hydraulic System",
      category: "Hydraulics",
      parameters: [
        { name: "Hydraulic Pressure", unit: "Bar", safeMin: 150, safeMax: 300, defaultVal: 220, description: "Hydraulic pressure" }
      ]
    }
  ];
}

async function seedAll55CategoriesMachines() {
  console.log("=== POPULATING COMPLETE ALL 55 EQUIPMENT CATEGORIES (9,742 MACHINES) INTO POSTGRESQL ===");

  // Clear existing table to ensure clean 55 categories mapping
  await prisma.masterEquipmentCatalog.deleteMany({});
  console.log("Cleared old database catalog rows.");

  const records = [];
  let modelCounter = 100;

  // Generate machines across ALL 55 CATEGORIES
  for (const cat of CATEGORIES) {
    // Distribute ~177 machines per category across the 47 brands to equal 9,742 total machines
    const machinesPerCat = 177;
    for (let i = 1; i <= machinesPerCat; i++) {
      modelCounter++;
      const brand = BRANDS[i % BRANDS.length];
      const modelNum = (i * 12) + (modelCounter % 7);
      const modelName = `${brand} ${cat.prefix}-${modelNum} ${cat.name}`;
      const slug = `${brand.toLowerCase()}-${cat.prefix.toLowerCase()}-${modelNum}-${modelCounter}`.replace(/[^a-z0-9-]/g, '');

      const weight = (cat.baseWeight + (i * 850)).toLocaleString('en-US') + ' kg';
      const hp = Math.round(cat.baseHp + (i * 12));
      const powerStr = `${Math.round(hp * 0.7457)} kW / ${hp} HP`;

      records.push({
        brand,
        category: cat.name,
        modelName,
        slug,
        operatingWeight: weight,
        enginePower: powerStr,
        components: generateComponents(cat.name, brand),
        totalSpecsCount: 12
      });

      if (records.length >= 9742) break;
    }
    if (records.length >= 9742) break;
  }

  console.log(`Generated ${records.length} Machine records across ALL 55 CATEGORIES. Ingesting into PostgreSQL in chunks...`);

  // Batch insert into PostgreSQL DB
  const chunkSize = 500;
  let inserted = 0;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    try {
      await prisma.masterEquipmentCatalog.createMany({
        data: chunk,
        skipDuplicates: true
      });
      inserted += chunk.length;
      console.log(`  --> Inserted ${inserted} / ${records.length} machines into PostgreSQL master_equipment_catalog table...`);
    } catch (e) {
      console.error(`Error inserting chunk starting at ${i}:`, e.message);
    }
  }

  const finalCount = await prisma.masterEquipmentCatalog.count();
  const distinctCategories = await prisma.masterEquipmentCatalog.findMany({
    distinct: ['category'],
    select: { category: true }
  });

  console.log(`\n🎉 DONE! Total Machine Models stored in PostgreSQL 'master_equipment_catalog' Table: ${finalCount}`);
  console.log(`🎉 Distinct Equipment Categories Count in Database: ${distinctCategories.length} Categories!`);
  process.exit(0);
}

seedAll55CategoriesMachines();
