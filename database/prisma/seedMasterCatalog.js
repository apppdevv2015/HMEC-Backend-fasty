const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MASTER_CATALOG_SEED_DATA = [
  // CATERPILLAR
  {
    brand: "Caterpillar",
    category: "Mining Haul Truck",
    modelName: "Caterpillar 777G Dump Truck",
    slug: "caterpillar-777g-dump-truck",
    operatingWeight: "163,360 kg",
    enginePower: "765 kW / 1,025 HP",
    components: [
      {
        name: "Cat C32 ACERT Engine",
        category: "Engine",
        parameters: [
          { name: "Engine Oil Pressure", unit: "PSI", safeMin: 30, safeMax: 65, defaultVal: 48, description: "Gallery oil pressure" },
          { name: "Coolant Temperature", unit: "°C", safeMin: 65, safeMax: 95, defaultVal: 82, description: "Engine coolant temp" },
          { name: "Engine RPM", unit: "RPM", safeMin: 650, safeMax: 2200, defaultVal: 1500, description: "Engine operating speed" },
          { name: "Engine Oil Level", unit: "%", safeMin: 75, safeMax: 100, defaultVal: 95, description: "Sump oil level" }
        ]
      },
      {
        name: "Cat 7-Speed Powershift Transmission",
        category: "Transmission",
        parameters: [
          { name: "Transmission Oil Temp", unit: "°C", safeMin: 60, safeMax: 95, defaultVal: 78, description: "Gearbox oil temp" },
          { name: "Clutch Pack Pressure", unit: "Bar", safeMin: 15, safeMax: 25, defaultVal: 20, description: "Hydraulic clutch pressure" }
        ]
      },
      {
        name: "Main Hoist Hydraulics",
        category: "Hydraulics",
        parameters: [
          { name: "Dump Cylinder Pressure", unit: "Bar", safeMin: 150, safeMax: 350, defaultVal: 220, description: "Body hoist cylinder pressure" },
          { name: "Hydraulic Oil Temp", unit: "°C", safeMin: 50, safeMax: 85, defaultVal: 65, description: "Hydraulic fluid temp" }
        ]
      },
      {
        name: "Haul Tyres & Wheels",
        category: "Tyres & Undercarriage",
        parameters: [
          { name: "Front Tyre Air Pressure", unit: "PSI", safeMin: 30, safeMax: 48, defaultVal: 38, description: "Front tyre pressure" },
          { name: "Rear Tyre Air Pressure", unit: "PSI", safeMin: 30, safeMax: 48, defaultVal: 38, description: "Rear dual tyre pressure" },
          { name: "Payload Weight Load", unit: "Tons", safeMin: 0, safeMax: 60, defaultVal: 35, description: "Payload tonnage" }
        ]
      }
    ]
  },
  {
    brand: "Caterpillar",
    category: "Mining Haul Truck",
    modelName: "Caterpillar 797F Ultra-Class Haul Truck",
    slug: "caterpillar-797f-haul-truck",
    operatingWeight: "623,690 kg",
    enginePower: "2,983 kW / 4,000 HP",
    components: [
      {
        name: "Cat C175-20 Quad Turbo Engine",
        category: "Engine",
        parameters: [
          { name: "Engine Oil Pressure", unit: "PSI", safeMin: 30, safeMax: 65, defaultVal: 52, description: "Quad-turbo gallery pressure" },
          { name: "Coolant Temperature", unit: "°C", safeMin: 65, safeMax: 95, defaultVal: 84, description: "Coolant temp" },
          { name: "Engine RPM", unit: "RPM", safeMin: 650, safeMax: 2100, defaultVal: 1650, description: "Working engine RPM" }
        ]
      },
      {
        name: "Cat 7-Speed Planetary Transmission",
        category: "Transmission",
        parameters: [
          { name: "Converter Oil Temp", unit: "°C", safeMin: 60, safeMax: 95, defaultVal: 80, description: "Torque converter oil temp" }
        ]
      },
      {
        name: "59/80R63 Mining Tyres",
        category: "Tyres & Undercarriage",
        parameters: [
          { name: "Tyre Air Pressure", unit: "PSI", safeMin: 30, safeMax: 48, defaultVal: 40, description: "Ultra-class tyre pressure" }
        ]
      }
    ]
  },
  {
    brand: "Caterpillar",
    category: "Hydraulic Excavator",
    modelName: "Caterpillar 349 Heavy Excavator",
    slug: "caterpillar-349-excavator",
    operatingWeight: "50,600 kg",
    enginePower: "322 kW / 432 HP",
    components: [
      {
        name: "Cat C13 ACERT Engine",
        category: "Engine",
        parameters: [
          { name: "Engine Oil Pressure", unit: "PSI", safeMin: 30, safeMax: 65, defaultVal: 45, description: "Oil gallery pressure" },
          { name: "Coolant Temperature", unit: "°C", safeMin: 65, safeMax: 95, defaultVal: 83, description: "Engine coolant temp" }
        ]
      },
      {
        name: "Twin Variable Piston Main Pump",
        category: "Hydraulics",
        parameters: [
          { name: "Main Pump Pressure", unit: "Bar", safeMin: 200, safeMax: 350, defaultVal: 285, description: "Hydraulic output pressure" },
          { name: "Hydraulic Oil Temp", unit: "°C", safeMin: 50, safeMax: 85, defaultVal: 68, description: "Hydraulic fluid temp" }
        ]
      }
    ]
  },
  {
    brand: "Caterpillar",
    category: "Track Dozer",
    modelName: "Caterpillar D11T Heavy Dozer",
    slug: "caterpillar-d11t-dozer",
    operatingWeight: "104,236 kg",
    enginePower: "634 kW / 850 HP",
    components: [
      {
        name: "Cat C32 Engine Assembly",
        category: "Engine",
        parameters: [
          { name: "Engine Oil Pressure", unit: "PSI", safeMin: 30, safeMax: 65, defaultVal: 50, description: "Dozer engine oil pressure" },
          { name: "Coolant Temperature", unit: "°C", safeMin: 65, safeMax: 95, defaultVal: 84, description: "Engine coolant temp" }
        ]
      },
      {
        name: "Elevated Sprocket Track System",
        category: "Tyres & Undercarriage",
        parameters: [
          { name: "Track Adjuster Tension", unit: "mm", safeMin: 200, safeMax: 350, defaultVal: 275, description: "Crawler track tension sag" }
        ]
      }
    ]
  },

  // KOMATSU
  {
    brand: "Komatsu",
    category: "Mining Haul Truck",
    modelName: "Komatsu HD785-7 Mining Truck",
    slug: "komatsu-hd785-7-truck",
    operatingWeight: "133,700 kg",
    enginePower: "895 kW / 1,200 HP",
    components: [
      {
        name: "Komatsu SDA12V140 Engine",
        category: "Engine",
        parameters: [
          { name: "Engine Oil Pressure", unit: "PSI", safeMin: 30, safeMax: 65, defaultVal: 47, description: "Oil pressure" },
          { name: "Coolant Temperature", unit: "°C", safeMin: 65, safeMax: 95, defaultVal: 82, description: "Coolant temp" }
        ]
      },
      {
        name: "Komatsu K-ATOMiCS Transmission",
        category: "Transmission",
        parameters: [
          { name: "Transmission Oil Temp", unit: "°C", safeMin: 60, safeMax: 95, defaultVal: 76, description: "Transmission temp" }
        ]
      }
    ]
  },
  {
    brand: "Komatsu",
    category: "Hydraulic Excavator",
    modelName: "Komatsu PC2000-8 Mining Excavator",
    slug: "komatsu-pc2000-8-excavator",
    operatingWeight: "204,000 kg",
    enginePower: "728 kW / 976 HP",
    components: [
      {
        name: "Komatsu SAA12V140E-3 Engine",
        category: "Engine",
        parameters: [
          { name: "Engine Oil Pressure", unit: "PSI", safeMin: 30, safeMax: 65, defaultVal: 46, description: "Oil pressure" },
          { name: "Coolant Temperature", unit: "°C", safeMin: 65, safeMax: 95, defaultVal: 84, description: "Coolant temp" }
        ]
      },
      {
        name: "Hydropilot Open-Center System",
        category: "Hydraulics",
        parameters: [
          { name: "Main Pump Pressure", unit: "Bar", safeMin: 200, safeMax: 350, defaultVal: 290, description: "Hydraulic pressure" }
        ]
      }
    ]
  },

  // VOLVO
  {
    brand: "Volvo",
    category: "Mining Haul Truck",
    modelName: "Volvo R100E Heavy Haul Truck",
    slug: "volvo-r100e-haul-truck",
    operatingWeight: "160,000 kg",
    enginePower: "783 kW / 1,050 HP",
    components: [
      {
        name: "Cummins QSK28 Diesel Engine",
        category: "Engine",
        parameters: [
          { name: "Engine Oil Pressure", unit: "PSI", safeMin: 30, safeMax: 65, defaultVal: 48, description: "Oil pressure" },
          { name: "Coolant Temperature", unit: "°C", safeMin: 65, safeMax: 95, defaultVal: 83, description: "Coolant temp" }
        ]
      }
    ]
  },
  {
    brand: "Volvo",
    category: "Wheel Loader",
    modelName: "Volvo L350H Large Wheel Loader",
    slug: "volvo-l350h-wheel-loader",
    operatingWeight: "56,000 kg",
    enginePower: "397 kW / 532 HP",
    components: [
      {
        name: "Volvo D16E Engine",
        category: "Engine",
        parameters: [
          { name: "Engine Oil Pressure", unit: "PSI", safeMin: 30, safeMax: 65, defaultVal: 46, description: "Oil pressure" },
          { name: "Coolant Temp", unit: "°C", safeMin: 65, safeMax: 95, defaultVal: 81, description: "Coolant temp" }
        ]
      }
    ]
  },

  // HITACHI
  {
    brand: "Hitachi",
    category: "Mining Haul Truck",
    modelName: "Hitachi EH5000AC-3 AC-Drive Truck",
    slug: "hitachi-eh5000ac-3-truck",
    operatingWeight: "500,000 kg",
    enginePower: "2,125 kW / 2,850 HP",
    components: [
      {
        name: "Cummins QSK60 Engine",
        category: "Engine",
        parameters: [
          { name: "Engine Oil Pressure", unit: "PSI", safeMin: 30, safeMax: 65, defaultVal: 50, description: "Oil pressure" }
        ]
      }
    ]
  },

  // JCB
  {
    brand: "JCB",
    category: "Wheel Loader",
    modelName: "JCB 457 Heavy Wheel Loader",
    slug: "jcb-457-wheel-loader",
    operatingWeight: "20,500 kg",
    enginePower: "210 kW / 282 HP",
    components: [
      {
        name: "Cummins B6.7 Stage V Engine",
        category: "Engine",
        parameters: [
          { name: "Engine Oil Pressure", unit: "PSI", safeMin: 30, safeMax: 65, defaultVal: 45, description: "Oil pressure" }
        ]
      }
    ]
  }
];

async function seedMasterCatalog() {
  console.log('Starting Heavy Equipment Master Catalog Database Seeding...');
  let seededCount = 0;

  for (const item of MASTER_CATALOG_SEED_DATA) {
    try {
      await prisma.masterEquipmentCatalog.upsert({
        where: { slug: item.slug },
        update: {
          brand: item.brand,
          category: item.category,
          modelName: item.modelName,
          operatingWeight: item.operatingWeight,
          enginePower: item.enginePower,
          components: item.components,
          totalSpecsCount: 12
        },
        create: {
          brand: item.brand,
          category: item.category,
          modelName: item.modelName,
          slug: item.slug,
          operatingWeight: item.operatingWeight,
          enginePower: item.enginePower,
          components: item.components,
          totalSpecsCount: 12
        }
      });
      seededCount++;
    } catch (err) {
      console.error(`Failed to seed catalog model ${item.modelName}:`, err.message);
    }
  }

  console.log(`✅ Successfully seeded ${seededCount} Heavy Equipment Catalog models into master_equipment_catalog database table!`);
  process.exit(0);
}

seedMasterCatalog();
