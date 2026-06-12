const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const SERVICE_ROOT = path.resolve(__dirname, "..");
const ROOT_DIR = path.resolve(SERVICE_ROOT, "..", "..");
const SCHEMA_PATH = path.join(SERVICE_ROOT, "src", "database", "prisma", "schema.prisma");

// Load Environment from service .env
const envPath = path.join(SERVICE_ROOT, ".env");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
}

function normalizeLocalDatabaseUrl(url) {
  if (!url || process.env.SEED_USE_DOCKER_HOST === "true") {
    return url;
  }
  return url.replace("host.docker.internal", "localhost");
}

function applySeedDatabaseUrl() {
  const serviceDatabaseUrl =
    process.env.AUTH_SERVICE_DATABASE_URL ||
    process.env.SEED_DATABASE_URL ||
    process.env.DATABASE_URL;

  if (serviceDatabaseUrl) {
    process.env.DATABASE_URL = normalizeLocalDatabaseUrl(serviceDatabaseUrl);
  }
}

function ensurePrismaClientGenerated() {
  if (process.env.SEED_SKIP_PRISMA_GENERATE === "true") {
    return;
  }

  const prismaCli = path.join(
    ROOT_DIR,
    "node_modules",
    "prisma",
    "build",
    "index.js"
  );
  
  console.log(`[auth-service seed] Generating Prisma Client...`);
  const result = spawnSync(
    process.execPath,
    [prismaCli, "generate", "--schema", SCHEMA_PATH],
    {
      cwd: SERVICE_ROOT,
      env: process.env,
      stdio: "inherit",
      windowsHide: true,
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Prisma generate failed with exit code ${result.status}`);
  }
}

function clearPrismaClientRequireCache() {
  const nodeModulesSegment = `${path.sep}node_modules${path.sep}`;

  for (const cacheKey of Object.keys(require.cache)) {
    if (
      cacheKey.includes(`${nodeModulesSegment}@prisma${path.sep}client${path.sep}`) ||
      cacheKey.includes(`${nodeModulesSegment}.prisma${path.sep}client${path.sep}`)
    ) {
      delete require.cache[cacheKey];
    }
  }
}

async function main() {
  let prisma;
  const startedAt = Date.now();

  try {
    applySeedDatabaseUrl();
    ensurePrismaClientGenerated();
    clearPrismaClientRequireCache();

    prisma = require("../src/database/prisma");
    await prisma.$connect();

    console.log("[auth-service seed] Seeding roles...");
    const roles = ['super_admin', 'admin', 'engineer', 'planner', 'viewer'];
    const seededRoles = {};
    for (const roleName of roles) {
      const role = await prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName },
      });
      seededRoles[roleName] = role;
    }
    console.log("✅ Roles seeded.");

    console.log("[auth-service seed] Seeding plans...");
    const plans = [
      { name: 'demo', machineLimit: 3, staffLimit: 5, price: 0, validityDays: 14 },
      { name: 'silver', machineLimit: 10, staffLimit: 20, price: 100, validityDays: 30 },
      { name: 'premium', machineLimit: 100, staffLimit: 100, price: 300, validityDays: 30 }
    ];
    
    for (const plan of plans) {
      const existingPlan = await prisma.plan.findFirst({
        where: { name: plan.name }
      });

      if (existingPlan) {
        await prisma.plan.update({
          where: { id: existingPlan.id },
          data: {
            price: plan.price,
            machineLimit: plan.machineLimit,
            staffLimit: plan.staffLimit,
            validityDays: plan.validityDays
          }
        });
      } else {
        await prisma.plan.create({
          data: {
            name: plan.name,
            price: plan.price,
            machineLimit: plan.machineLimit,
            staffLimit: plan.staffLimit,
            validityDays: plan.validityDays
          }
        });
      }
    }
    console.log("✅ Plans seeded.");

    console.log("[auth-service seed] Seeding companies...");
    const systemCompany = await prisma.company.upsert({
      where: { id: '00000000-0000-0000-0000-000000000000' },
      update: { name: 'HME Systems' },
      create: {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'HME Systems',
        subscriptionStatus: 'active'
      },
    });

    const globalCompany = await prisma.company.upsert({
      where: { id: '11111111-1111-1111-1111-111111111111' },
      update: { name: 'HME Global' },
      create: {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'HME Global',
        subscriptionStatus: 'active'
      },
    });
    console.log("✅ Companies seeded.");

    console.log("[auth-service seed] Seeding default users...");
    const superHashedPassword = await bcrypt.hash('HME@super2026', 10);
    const adminHashedPassword = await bcrypt.hash('HME@admin2026', 10);
    const defaultAdminPassword = await bcrypt.hash('admin', 10);

    // Super Admin
    await prisma.user.upsert({
      where: { email: 'superadmin@hme.com' },
      update: {
        password: superHashedPassword,
        firstName: 'HME',
        lastName: 'SuperAdmin',
        roleId: seededRoles['super_admin'].id,
        companyId: systemCompany.id,
      },
      create: {
        email: 'superadmin@hme.com',
        password: superHashedPassword,
        firstName: 'HME',
        lastName: 'SuperAdmin',
        roleId: seededRoles['super_admin'].id,
        companyId: systemCompany.id,
      },
    });

    // HME Systems Admin
    await prisma.user.upsert({
      where: { email: 'admin@hme.com' },
      update: {
        password: adminHashedPassword,
        firstName: 'System',
        lastName: 'Admin',
        roleId: seededRoles['admin'].id,
        companyId: systemCompany.id,
      },
      create: {
        email: 'admin@hme.com',
        password: adminHashedPassword,
        firstName: 'System',
        lastName: 'Admin',
        roleId: seededRoles['admin'].id,
        companyId: systemCompany.id,
      },
    });

    // HME Global Admin
    await prisma.user.upsert({
      where: { email: 'admin@gmail.com' },
      update: {
        password: defaultAdminPassword,
        firstName: 'System',
        lastName: 'Admin',
        roleId: seededRoles['admin'].id,
        companyId: globalCompany.id,
      },
      create: {
        email: 'admin@gmail.com',
        password: defaultAdminPassword,
        firstName: 'System',
        lastName: 'Admin',
        roleId: seededRoles['admin'].id,
        companyId: globalCompany.id,
      },
    });
    console.log("✅ Default users seeded.");

    console.log(`[auth-service seed] Completed in ${Date.now() - startedAt}ms`);

    return {
      success: true,
      durationMs: Date.now() - startedAt
    };
  } catch (error) {
    console.error("\n[auth-service seed] Failed");
    console.error(error);
    process.exitCode = 1;
    return null;
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("\n[auth-service seed] Failed");
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  main,
};
