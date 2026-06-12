const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { Client } = require("pg");
const { loadEnvironment } = require("../bootstrap/env");

/**
 * Production-safe Prisma DB bootstrap.
 *
 * Your project layout:
 *
 * Schema folder:
 * src/database/models (or src/database/prisma/schema.prisma)
 *
 * Migration folder:
 * src/database/migrations (or src/database/prisma/migrations)
 */

const SERVICE_ROOT = path.resolve(__dirname, "../..");
const SCHEMA_PATH = fs.existsSync(path.join(SERVICE_ROOT, "src/database/prisma/schema.prisma"))
  ? path.join(SERVICE_ROOT, "src/database/prisma/schema.prisma")
  : path.join(SERVICE_ROOT, "src/database/models");

const MIGRATIONS_DIR = fs.existsSync(path.join(SERVICE_ROOT, "src/database/prisma"))
  ? path.join(SERVICE_ROOT, "src/database/prisma/migrations")
  : path.join(SERVICE_ROOT, "src/database/migrations");

const DESTRUCTIVE_SQL_PATTERNS = [
  { label: "DROP TABLE", pattern: /\bDROP\s+TABLE\b/i },
  { label: "DROP COLUMN", pattern: /\bDROP\s+COLUMN\b/i },
  { label: "DROP CONSTRAINT", pattern: /\bDROP\s+CONSTRAINT\b/i },
  { label: "TRUNCATE", pattern: /\bTRUNCATE\b/i },
  { label: "DELETE FROM", pattern: /\bDELETE\s+FROM\b/i },
  { label: "ALTER COLUMN TYPE", pattern: /\bALTER\s+COLUMN\b[\s\S]*\bTYPE\b/i },
  {
    label: "ALTER COLUMN SET NOT NULL",
    pattern: /\bALTER\s+COLUMN\b[\s\S]*\bSET\s+NOT\s+NULL\b/i,
  },
];

const NON_IDEMPOTENT_RETRY_PATTERNS = [
  {
    label: "CREATE TABLE without IF NOT EXISTS",
    pattern: /\bCREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS\b)/i,
  },
  {
    label: "CREATE INDEX without IF NOT EXISTS",
    pattern: /\bCREATE\s+(?:UNIQUE\s+)?INDEX\s+(?!IF\s+NOT\s+EXISTS\b)/i,
  },
  {
    label: "ADD COLUMN without IF NOT EXISTS",
    pattern: /\bADD\s+COLUMN\s+(?!IF\s+NOT\s+EXISTS\b)/i,
  },
  {
    label: "DROP INDEX without IF EXISTS",
    pattern: /\bDROP\s+INDEX\s+(?!IF\s+EXISTS\b)/i,
  },
  {
    label: "DROP CONSTRAINT without IF EXISTS",
    pattern: /\bDROP\s+CONSTRAINT\s+(?!IF\s+EXISTS\b)/i,
  },
  { label: "ADD CONSTRAINT", pattern: /\bADD\s+CONSTRAINT\b/i },
  { label: "INSERT statement", pattern: /\bINSERT\s+INTO\b/i },
  { label: "UPDATE statement", pattern: /\bUPDATE\b/i },
];

function getPrismaCliPath() {
  const candidates = [
    path.resolve(SERVICE_ROOT, "../../node_modules/prisma/build/index.js"),
    path.resolve(SERVICE_ROOT, "node_modules/prisma/build/index.js"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return require.resolve("prisma/build/index.js");
}

function getPrismaConfigModulePath() {
  const candidates = [
    path.resolve(SERVICE_ROOT, "../../node_modules/prisma/config.js"),
    path.resolve(SERVICE_ROOT, "node_modules/prisma/config.js"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  try {
    return require.resolve("prisma/config");
  } catch (e) {
    return "prisma/config";
  }
}

function runPrisma(args, options = {}) {
  const prismaArgs = [getPrismaCliPath(), ...args];

  if (options.configPath) {
    prismaArgs.push("--config", options.configPath);
  }

  prismaArgs.push("--schema", SCHEMA_PATH);

  const output = execFileSync(
    process.execPath,
    prismaArgs,
    {
      stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
      cwd: SERVICE_ROOT,
      env: process.env,
      encoding: "utf8",
      shell: false,
    },
  );

  return output || "";
}

function resolveBooleanEnv(name, defaultValue) {
  const value = process.env[name];

  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  return String(value).trim().toLowerCase() === "true";
}

function resolveIntegerEnv(name, defaultValue) {
  const value = process.env[name];

  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }

  return parsed;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveAutoApplySetting() {
  return resolveBooleanEnv("DB_AUTO_APPLY", true);
}

function resolveAutoCreateDatabaseSetting(appEnv) {
  return resolveBooleanEnv("DB_AUTO_CREATE_DATABASE", appEnv === "development");
}

function isDeployOnlyCommand() {
  return process.argv.includes("--deploy-only");
}

function resolveSyncStrategy(appEnv) {
  if (isDeployOnlyCommand()) {
    return "migrate";
  }

  const rawStrategy = String(
    process.env.DB_SYNC_STRATEGY ||
      (appEnv === "development" ? "migrate-dev" : "migrate"),
  )
    .trim()
    .toLowerCase();

  if (["migrate", "migrate-deploy", "deploy"].includes(rawStrategy)) {
    return "migrate";
  }

  if (["migrate-dev", "dev", "auto", "auto-migrate"].includes(rawStrategy)) {
    return "migrate-dev";
  }

  if (["push", "db-push", "db_push"].includes(rawStrategy)) {
    return "push";
  }

  throw new Error(
    `Unsupported DB_SYNC_STRATEGY: ${rawStrategy}. Use migrate, migrate-dev, or push.`,
  );
}

function resolveAutoBaselineSetting(appEnv) {
  return resolveBooleanEnv("DB_AUTO_BASELINE", true);
}

function resolveDestructiveMigrationSetting() {
  return resolveBooleanEnv("DB_ALLOW_DESTRUCTIVE_MIGRATIONS", false);
}

function resolveAutoRollbackFailedAutoMigrationsSetting(appEnv) {
  return resolveBooleanEnv(
    "DB_AUTO_ROLLBACK_FAILED_AUTO_MIGRATIONS",
    true,
  );
}

function resolveStrictMigrationFailureSetting(appEnv) {
  return resolveBooleanEnv("DB_STRICT_MIGRATION_FAILURES", false);
}

function resolveSchemaLockTimeoutMs() {
  return resolveIntegerEnv("DB_SCHEMA_LOCK_TIMEOUT_MS", 120000);
}

function getDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for database bootstrap.");
  }

  return new URL(process.env.DATABASE_URL);
}

function isDockerRuntime() {
  return (
    fs.existsSync("/.dockerenv") ||
    process.env.DOCKER_CONTAINER === "true" ||
    Boolean(process.env.KUBERNETES_SERVICE_HOST)
  );
}

function isConnectionFailure(error) {
  if (
    [
      "timeout expired",
      "connection terminated",
      "connection ended unexpectedly",
    ].some((message) =>
      String(error?.message || "")
        .toLowerCase()
        .includes(message),
    )
  ) {
    return true;
  }

  return [
    "ECONNREFUSED",
    "ENOTFOUND",
    "ETIMEDOUT",
    "EHOSTUNREACH",
    "ENETUNREACH",
    "EAI_AGAIN",
  ].includes(error?.code);
}

function toAdminDatabaseUrl(databaseUrl) {
  const adminUrl = new URL(databaseUrl.toString());
  adminUrl.pathname = "/postgres";
  return adminUrl;
}

async function assertDatabaseServerReachable(databaseUrl) {
  const client = new Client({
    connectionString: toAdminDatabaseUrl(databaseUrl).toString(),
    connectionTimeoutMillis: resolveIntegerEnv(
      "DB_CONNECT_TIMEOUT_MS",
      3000,
    ),
  });

  await client.connect();
  await client.end();
}

async function resolveReachableDevelopmentDatabaseUrl(appEnv) {
  if (appEnv !== "development" || isDockerRuntime()) {
    return;
  }

  const databaseUrl = getDatabaseUrl();

  if (databaseUrl.hostname !== "host.docker.internal") {
    return;
  }

  try {
    await assertDatabaseServerReachable(databaseUrl);
    return;
  } catch (error) {
    if (!isConnectionFailure(error)) {
      throw error;
    }
  }

  const localhostUrl = new URL(databaseUrl.toString());
  localhostUrl.hostname = "localhost";

  try {
    await assertDatabaseServerReachable(localhostUrl);
  } catch (error) {
    console.warn(
      [
        "Development database host host.docker.internal is unreachable from this process.",
        "Tried localhost fallback too, but it was not reachable.",
        `Original error: ${error.message}`,
      ].join("\n"),
    );
    return;
  }

  process.env.DATABASE_URL = localhostUrl.toString();
  console.warn(
    "Using localhost database URL for non-Docker development process because host.docker.internal is unreachable.",
  );
}

function toSafeIdentifier(value, label) {
  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    throw new Error(`Unsupported ${label} identifier: ${value}`);
  }

  return `"${value}"`;
}

function getMigrationSchemaName() {
  return getDatabaseUrl().searchParams.get("schema") || "public";
}

function getQualifiedMigrationTableName() {
  return `${toSafeIdentifier(getMigrationSchemaName(), "schema")}."_prisma_migrations"`;
}

function getMigrationLockKey() {
  const databaseUrl = getDatabaseUrl();
  const databaseName = databaseUrl.pathname.replace(/^\//, "") || "postgres";
  return `aos:migration:${databaseName}:${getMigrationSchemaName()}`;
}

async function acquireMigrationLock(client) {
  const lockKey = getMigrationLockKey();
  const timeoutMs = resolveSchemaLockTimeoutMs();
  const startedAt = Date.now();

  while (true) {
    const result = await client.query(
      "SELECT pg_try_advisory_lock(hashtext($1)) AS locked",
      [lockKey],
    );

    if (result.rows[0]?.locked) {
      console.log(`Acquired migration lock: ${lockKey}`);
      return lockKey;
    }

    if (Date.now() - startedAt >= timeoutMs) {
      throw new Error(
        `Timed out waiting for migration lock after ${timeoutMs}ms: ${lockKey}`,
      );
    }

    await sleep(1000);
  }
}

async function withMigrationLock(operation) {
  const client = new Client({
    connectionString: getDatabaseUrl().toString(),
  });

  await client.connect();
  let lockKey;

  try {
    lockKey = await acquireMigrationLock(client);
    return await operation();
  } finally {
    if (lockKey) {
      await client.query("SELECT pg_advisory_unlock(hashtext($1))", [lockKey]);
      console.log(`Released migration lock: ${lockKey}`);
    }

    await client.end();
  }
}

function getBaselineSchemaNames() {
  const schemaNames = new Set([getMigrationSchemaName()]);

  (process.env.DB_REQUIRED_SCHEMAS || process.env.AI_SCHEMA || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((schemaName) => schemaNames.add(schemaName));

  return [...schemaNames];
}

function stripSqlComments(sql) {
  return String(sql || "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");
}

function stripDataPreservingTextTypeChanges(sql) {
  return String(sql || "").replace(
    /\bALTER\s+COLUMN\s+(?:"[^"]+"|[A-Za-z_][A-Za-z0-9_$]*)\s+(?:SET\s+DATA\s+)?TYPE\s+(?:TEXT|VARCHAR\s*\(\s*\d+\s*\))(?:\s+USING\s+(?:"[^"]+"|[A-Za-z_][A-Za-z0-9_$]*)::text)?/gi,
    "",
  );
}

function findDestructiveStatements(sql) {
  const uncommentedSql = stripDataPreservingTextTypeChanges(
    stripSqlComments(sql),
  );

  return DESTRUCTIVE_SQL_PATTERNS.filter(({ pattern }) =>
    pattern.test(uncommentedSql),
  ).map(({ label }) => label);
}

function findRetryUnsafeStatements(sql) {
  const uncommentedSql = stripSqlComments(sql);

  return NON_IDEMPOTENT_RETRY_PATTERNS.filter(({ pattern }) =>
    pattern.test(uncommentedSql),
  ).map(({ label }) => label);
}

function assertSqlIsSafeForAutoApply(sql, migrationName) {
  if (resolveDestructiveMigrationSetting()) {
    console.warn(
      "Destructive migration guard disabled by DB_ALLOW_DESTRUCTIVE_MIGRATIONS=true.",
    );
    return;
  }

  const destructiveStatements = findDestructiveStatements(sql);

  if (destructiveStatements.length === 0) {
    return;
  }

  throw new Error(
    [
      `Refusing to auto-apply destructive SQL in ${migrationName}.`,
      `Detected: ${destructiveStatements.join(", ")}`,
      "",
      "Review migration.sql manually before applying.",
      "Do not set DB_ALLOW_DESTRUCTIVE_MIGRATIONS=true unless you intentionally accept data loss.",
    ].join("\n"),
  );
}

function filterUnsafeAutoMigrationSql(sql, migrationName) {
  if (resolveDestructiveMigrationSetting()) {
    assertSqlIsSafeForAutoApply(sql, migrationName);
    return sql;
  }

  const keptStatements = [];
  const skippedStatements = [];

  for (const statement of splitSqlStatements(sql)) {
    const destructiveStatements = findDestructiveStatements(statement);

    if (destructiveStatements.length > 0) {
      skippedStatements.push(
        `${destructiveStatements.join(", ")}: ${stripSqlComments(statement)
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 220)}`,
      );
      continue;
    }

    keptStatements.push(statement);
  }

  if (skippedStatements.length === 0) {
    return sql;
  }

  console.warn(
    [
      `Skipped unsafe SQL in ${migrationName}.`,
      "These statements were not applied automatically, so existing data is preserved:",
      ...skippedStatements.map((statement) => `- ${statement}`),
    ].join("\n"),
  );

  return keptStatements.length > 0 ? `${keptStatements.join(";\n\n")};` : "";
}

function getMigrationSqlPath(migrationName) {
  return path.join(MIGRATIONS_DIR, migrationName, "migration.sql");
}

function hasMigrationSql(migrationName) {
  return fs.existsSync(getMigrationSqlPath(migrationName));
}

function getMigrationDirectories(options = {}) {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter(
      (migrationName) => options.includeMissingSql || hasMigrationSql(migrationName),
    )
    .sort();
}

function getMigrationsMissingSql() {
  return getMigrationDirectories({ includeMissingSql: true }).filter(
    (migrationName) => !hasMigrationSql(migrationName),
  );
}

function parseSqlIdentifierToken(token) {
  const trimmed = String(token || "").trim();

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/""/g, '"');
  }

  return trimmed.toLowerCase();
}

function parseSqlIdentifierReference(value) {
  const tokens = [
    ...String(value || "").matchAll(/"((?:[^"]|"")*)"|([A-Za-z_][A-Za-z0-9_$]*)/g),
  ].map((match) => (match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2].toLowerCase()));

  if (tokens.length === 1) {
    return {
      schema: getMigrationSchemaName(),
      name: tokens[0],
      explicitSchema: false,
    };
  }

  if (tokens.length === 2) {
    return {
      schema: tokens[0],
      name: tokens[1],
      explicitSchema: true,
    };
  }

  return null;
}

function toEvidenceKey(item) {
  return [item.type, item.schema, item.table || "", item.name || ""].join(":");
}

function addEvidence(evidence, seen, item) {
  const key = toEvidenceKey(item);

  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  evidence.push(item);
}

function collectMigrationStateEvidence(migrationSql) {
  const cleanSql = stripSqlComments(migrationSql);
  const evidence = [];
  const seen = new Set();
  const identifierPattern = String.raw`(?:"(?:[^"]|"")+"|[A-Za-z_][A-Za-z0-9_$]*)`;
  const tableRefPattern = `${identifierPattern}(?:\\s*\\.\\s*${identifierPattern})?`;

  for (const match of cleanSql.matchAll(new RegExp(`\\bCREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(${tableRefPattern})`, "gi"))) {
    const tableRef = parseSqlIdentifierReference(match[1]);

    if (tableRef) {
      addEvidence(evidence, seen, {
        type: "table",
        schema: tableRef.schema,
        table: tableRef.name,
      });
    }
  }

  for (const match of cleanSql.matchAll(new RegExp(`\\bALTER\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(?:ONLY\\s+)?(${tableRefPattern})\\s+ADD\\s+COLUMN\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(${identifierPattern})`, "gi"))) {
    const tableRef = parseSqlIdentifierReference(match[1]);
    const columnName = parseSqlIdentifierToken(match[2]);

    if (tableRef && columnName) {
      addEvidence(evidence, seen, {
        type: "column",
        schema: tableRef.schema,
        table: tableRef.name,
        name: columnName,
      });
    }
  }

  for (const match of cleanSql.matchAll(new RegExp(`\\bCREATE\\s+(?:UNIQUE\\s+)?INDEX\\s+(?:CONCURRENTLY\\s+)?(?:IF\\s+NOT\\s+EXISTS\\s+)?(${tableRefPattern})\\s+ON\\s+(?:ONLY\\s+)?(${tableRefPattern})`, "gi"))) {
    const indexRef = parseSqlIdentifierReference(match[1]);
    const tableRef = parseSqlIdentifierReference(match[2]);

    if (indexRef && tableRef) {
      addEvidence(evidence, seen, {
        type: "index",
        schema: indexRef.explicitSchema ? indexRef.schema : tableRef.schema,
        table: tableRef.name,
        name: indexRef.name,
      });
    }
  }

  for (const match of cleanSql.matchAll(new RegExp(`\\bALTER\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(?:ONLY\\s+)?(${tableRefPattern})\\s+ADD\\s+CONSTRAINT\\s+(${identifierPattern})`, "gi"))) {
    const tableRef = parseSqlIdentifierReference(match[1]);
    const constraintName = parseSqlIdentifierToken(match[2]);

    if (tableRef && constraintName) {
      addEvidence(evidence, seen, {
        type: "constraint",
        schema: tableRef.schema,
        table: tableRef.name,
        name: constraintName,
      });
    }
  }

  return evidence;
}

async function indexExists(client, schemaName, indexName) {
  const result = await client.query(
    `
      SELECT 1
      FROM pg_class index_class
      JOIN pg_namespace index_namespace
        ON index_namespace.oid = index_class.relnamespace
      WHERE index_namespace.nspname = $1
        AND index_class.relname = $2
        AND index_class.relkind IN ('i', 'I')
      LIMIT 1
    `,
    [schemaName, indexName],
  );

  return result.rowCount > 0;
}

async function constraintExists(client, schemaName, tableName, constraintName) {
  const result = await client.query(
    `
      SELECT 1
      FROM pg_constraint constraint_record
      JOIN pg_class table_class
        ON table_class.oid = constraint_record.conrelid
      JOIN pg_namespace table_namespace
        ON table_namespace.oid = table_class.relnamespace
      WHERE table_namespace.nspname = $1
        AND table_class.relname = $2
        AND constraint_record.conname = $3
      LIMIT 1
    `,
    [schemaName, tableName, constraintName],
  );

  return result.rowCount > 0;
}

async function migrationEvidenceExists(client, item) {
  if (item.type === "table") {
    return tableExists(client, item.schema, item.table);
  }

  if (item.type === "column") {
    return tableColumnExists(client, item.schema, item.table, item.name);
  }

  if (item.type === "index") {
    return indexExists(client, item.schema, item.name);
  }

  if (item.type === "constraint") {
    return constraintExists(client, item.schema, item.table, item.name);
  }

  return false;
}

function formatMigrationEvidence(item) {
  if (item.type === "table") {
    return `${item.schema}.${item.table}`;
  }

  if (item.type === "column") {
    return `${item.schema}.${item.table}.${item.name}`;
  }

  return `${item.schema}.${item.name}`;
}

function formatBaselineBlocker(migrationName, message, details = []) {
  return [
    `Cannot safely baseline existing database migration ${migrationName}.`,
    message,
    ...details.map((detail) => `- ${detail}`),
    "No schema changes were applied.",
    "Manual recovery: back up the database, inspect the missing/partial objects, apply a reviewed repair migration or resolve Prisma history manually, then rerun bootstrap.",
  ].join("\n");
}

async function evaluateGenericMigrationBaselineState(client, migrationName, migrationSql) {
  const evidence = collectMigrationStateEvidence(migrationSql);

  if (evidence.length === 0) {
    return {
      baseline: true,
      reason: "migration has no detectable schema objects",
    };
  }

  const existing = [];
  const missing = [];

  for (const item of evidence) {
    if (await migrationEvidenceExists(client, item)) {
      existing.push(item);
    } else {
      missing.push(item);
    }
  }

  if (missing.length === 0) {
    return {
      baseline: true,
      reason: "all detected schema objects already exist",
    };
  }

  const createsTables = evidence.some((item) => item.type === "table");
  const anyCreatedTableExists = evidence.some(
    (item) =>
      item.type === "table" &&
      existing.some(
        (existingItem) =>
          existingItem.type === "table" &&
          existingItem.schema === item.schema &&
          existingItem.table === item.table,
      ),
  );

  if (createsTables && anyCreatedTableExists) {
    throw new Error(
      formatBaselineBlocker(
        migrationName,
        "The database already has at least one table from this migration, but not every detected object exists. Running the migration could recreate existing tables; baselining it would hide missing schema.",
        missing.map((item) => `missing ${item.type}: ${formatMigrationEvidence(item)}`),
      ),
    );
  }

  if (existing.length > 0) {
    throw new Error(
      formatBaselineBlocker(
        migrationName,
        "The database partially matches this migration. Startup will not guess whether to baseline or apply it.",
        [
          ...existing.map((item) => `exists: ${item.type} ${formatMigrationEvidence(item)}`),
          ...missing.map((item) => `missing: ${item.type} ${formatMigrationEvidence(item)}`),
        ],
      ),
    );
  }

  return {
    baseline: false,
    reason: "detected schema objects are not present and migration should run normally",
  };
}

async function evaluateTableRenameMigrationBaselineState(client, migrationName, migrationSql) {
  const rules = parseTableRenameRulesFromSql(
    migrationSql,
    path.relative(SERVICE_ROOT, getMigrationSqlPath(migrationName)),
  );

  if (rules.length === 0) {
    return evaluateGenericMigrationBaselineState(client, migrationName, migrationSql);
  }

  let hasPendingRename = false;

  for (const rule of rules) {
    const oldExists = await tableExists(client, rule.schemaName, rule.oldTable);
    const newExists = await tableExists(client, rule.schemaName, rule.newTable);

    if (oldExists && newExists) {
      throw new Error(
        formatBaselineBlocker(
          migrationName,
          `Both ${rule.schemaName}.${rule.oldTable} and ${rule.schemaName}.${rule.newTable} exist.`,
          ["Duplicate old/new table state requires manual data review."],
        ),
      );
    }

    if (oldExists || !newExists) {
      hasPendingRename = true;
    }
  }

  return {
    baseline: !hasPendingRename,
    reason: hasPendingRename
      ? "one or more table rename rules still need to run"
      : "all table rename targets already exist",
  };
}

async function evaluateColumnRenameMigrationBaselineState(client, migrationName, migrationSql) {
  const tableRenameMap = new Map(
    loadTableRenameRules().map((rule) => [`${rule.schemaName}.${rule.oldTable}`, rule.newTable]),
  );
  const rules = parseColumnRenameRulesFromSql(
    migrationSql,
    path.relative(SERVICE_ROOT, getMigrationSqlPath(migrationName)),
    tableRenameMap,
  );

  if (rules.length === 0) {
    return evaluateGenericMigrationBaselineState(client, migrationName, migrationSql);
  }

  let hasPendingRename = false;

  for (const rule of rules) {
    const existingTables = [];

    for (const tableName of rule.tableNamesToCheck) {
      if (await tableExists(client, rule.schemaName, tableName)) {
        existingTables.push(tableName);
      }
    }

    if (existingTables.length === 0) {
      hasPendingRename = true;
      continue;
    }

    for (const tableName of existingTables) {
      const existingColumns = await getExistingColumnNames(
        client,
        rule.schemaName,
        tableName,
        [rule.oldColumn, rule.newColumn],
      );
      const oldExists = existingColumns.has(rule.oldColumn);
      const newExists = existingColumns.has(rule.newColumn);

      if (oldExists && newExists) {
        throw new Error(
          formatBaselineBlocker(
            migrationName,
            `${rule.schemaName}.${tableName} has both ${rule.oldColumn} and ${rule.newColumn}.`,
            ["Duplicate old/new column state requires manual data review."],
          ),
        );
      }

      if (oldExists || !newExists) {
        hasPendingRename = true;
      }
    }
  }

  return {
    baseline: !hasPendingRename,
    reason: hasPendingRename
      ? "one or more column rename rules still need to run"
      : "all column rename targets already exist",
  };
}

async function evaluateMigrationBaselineState(client, migrationName) {
  const migrationSqlPath = getMigrationSqlPath(migrationName);

  if (!fs.existsSync(migrationSqlPath)) {
    return {
      baseline: false,
      reason: "migration.sql is missing",
    };
  }

  const migrationSql = fs.readFileSync(migrationSqlPath, "utf8");

  if (migrationName.includes("rename_tables_camel_case")) {
    return evaluateTableRenameMigrationBaselineState(
      client,
      migrationName,
      migrationSql,
    );
  }

  if (migrationName.includes("rename_columns_camel_case")) {
    return evaluateColumnRenameMigrationBaselineState(
      client,
      migrationName,
      migrationSql,
    );
  }

  return evaluateGenericMigrationBaselineState(client, migrationName, migrationSql);
}

function writeRuntimePrismaConfig(configPath, migrationsPath) {
  const prismaConfigModulePath = getPrismaConfigModulePath();

  fs.writeFileSync(
    configPath,
    [
      `const { defineConfig } = require(${JSON.stringify(prismaConfigModulePath)});`,
      "",
      "module.exports = defineConfig({",
      `  schema: ${JSON.stringify(SCHEMA_PATH)},`,
      "  migrations: {",
      `    path: ${JSON.stringify(migrationsPath)},`,
      "  },",
      "});",
      "",
    ].join("\n"),
    "utf8",
  );
}

function createMigrationWorkspace(appEnv, options = {}) {
  const missingMigrationNames = getMigrationsMissingSql();
  const excludedMigrationNames = options.excludeMigrationNames || new Set();

  if (missingMigrationNames.length > 0) {
    console.warn(
      [
        "Ignoring migration folders without migration.sql:",
        ...missingMigrationNames.map((migrationName) => `- ${migrationName}`),
        "No migration files were modified. Startup will rely only on explicit migration files.",
      ].join("\n"),
    );
  }

  const workspaceRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "aos-prisma-migrations-"),
  );
  const runtimeMigrationsDir = path.join(workspaceRoot, "migrations");
  const runtimeConfigPath = path.join(workspaceRoot, "prisma.config.js");

  fs.mkdirSync(runtimeMigrationsDir, { recursive: true });

  const migrationLockPath = path.join(MIGRATIONS_DIR, "migration_lock.toml");
  if (fs.existsSync(migrationLockPath)) {
    fs.copyFileSync(
      migrationLockPath,
      path.join(runtimeMigrationsDir, "migration_lock.toml"),
    );
  }

  for (const migrationName of getMigrationDirectories()) {
    if (excludedMigrationNames.has(migrationName)) {
      continue;
    }

    assertMigrationName(migrationName);
    fs.cpSync(
      path.join(MIGRATIONS_DIR, migrationName),
      path.join(runtimeMigrationsDir, migrationName),
      { recursive: true },
    );
  }

  writeRuntimePrismaConfig(runtimeConfigPath, runtimeMigrationsDir);

  return {
    configPath: runtimeConfigPath,
    migrationNames: getMigrationDirectories().filter(
      (migrationName) => !excludedMigrationNames.has(migrationName),
    ),
    root: workspaceRoot,
  };
}

function cleanupMigrationWorkspace(workspace) {
  if (!workspace?.root) {
    return;
  }

  const resolvedWorkspaceRoot = path.resolve(workspace.root);
  const resolvedTempRoot = path.resolve(os.tmpdir());

  if (!resolvedWorkspaceRoot.startsWith(resolvedTempRoot + path.sep)) {
    return;
  }

  fs.rmSync(resolvedWorkspaceRoot, { recursive: true, force: true });
}

function assertMigrationName(value) {
  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    throw new Error(`Unsupported migration name: ${value}`);
  }
}

function isDevelopmentAutoMigrationName(migrationName) {
  return /^\d{14}_auto_sync$/.test(migrationName);
}

function parseQuotedIdentifiers(value) {
  return [...String(value || "").matchAll(/"([^"]+)"/g)].map(
    (match) => match[1],
  );
}

function parseQualifiedTableName(value) {
  const parts = parseQuotedIdentifiers(value);

  if (parts.length === 1) {
    return {
      schema: getMigrationSchemaName(),
      table: parts[0],
    };
  }

  if (parts.length === 2) {
    return {
      schema: parts[0],
      table: parts[1],
    };
  }

  return null;
}

function splitSqlStatements(sql) {
  return String(sql || "")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function mergeSets(...sets) {
  const merged = new Set();

  for (const set of sets) {
    for (const value of set || []) {
      merged.add(value);
    }
  }

  return merged;
}

function makeDropIndexStatementsIdempotent(sql) {
  return String(sql || "").replace(
    /\bDROP\s+INDEX\s+(CONCURRENTLY\s+)?(?!IF\s+NOT\s+EXISTS\b)/gi,
    (_match, concurrently = "") => `DROP INDEX ${concurrently}IF EXISTS `,
  );
}

function parseDropIndexStatement(statement) {
  const match = stripSqlComments(statement)
    .trim()
    .match(
      /^DROP\s+INDEX\s+(?:CONCURRENTLY\s+)?(?:IF\s+EXISTS\s+)?(?:(?:"([^"]+)"\.)?"([^"]+)")$/i,
    );

  if (!match) {
    return null;
  }

  return {
    schemaName: match[1] || getMigrationSchemaName(),
    indexName: match[2],
  };
}

async function rewriteDropIndexIfBackedByConstraint(client, statement) {
  const parsed = parseDropIndexStatement(statement);

  if (!parsed) {
    return statement;
  }

  const result = await client.query(
    `
      SELECT table_namespace.nspname AS table_schema,
             table_class.relname AS table_name
      FROM pg_constraint constraint_record
      JOIN pg_class table_class
        ON table_class.oid = constraint_record.conrelid
      JOIN pg_namespace table_namespace
        ON table_namespace.oid = table_class.relnamespace
      JOIN pg_namespace constraint_namespace
        ON constraint_namespace.oid = constraint_record.connamespace
      WHERE constraint_record.conname = $1
        AND constraint_namespace.nspname = $2
      LIMIT 1
    `,
    [parsed.indexName, parsed.schemaName],
  );

  if (result.rowCount === 0) {
    return statement;
  }

  const row = result.rows[0];

  return `ALTER TABLE ${toSafeIdentifier(
    row.table_schema,
    "schema",
  )}.${toSafeIdentifier(row.table_name, "table")} DROP CONSTRAINT IF EXISTS ${toSafeIdentifier(
    parsed.indexName,
    "constraint",
  )}`;
}

function makeCreateIndexStatementsIdempotent(sql) {
  return String(sql || "").replace(
    /\bCREATE\s+(UNIQUE\s+)?INDEX\s+(CONCURRENTLY\s+)?(?!IF\s+NOT\s+EXISTS\b)/gi,
    (_match, unique = "", concurrently = "") =>
      `CREATE ${unique || ""}INDEX ${concurrently || ""}IF NOT EXISTS `,
  );
}

function makeCreateTableStatementsIdempotent(sql) {
  return String(sql || "").replace(
    /\bCREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS\b)/gi,
    "CREATE TABLE IF NOT EXISTS ",
  );
}

function makeAddColumnStatementsIdempotent(sql) {
  return String(sql || "").replace(
    /\bADD\s+COLUMN\s+(?!IF\s+NOT\s+EXISTS\b)/gi,
    "ADD COLUMN IF NOT EXISTS ",
  );
}

function makeSqlIdempotentForRetry(sql) {
  return makeAddColumnStatementsIdempotent(
    makeCreateTableStatementsIdempotent(
      makeCreateIndexStatementsIdempotent(
        makeDropIndexStatementsIdempotent(sql),
      ),
    ),
  );
}

async function getAppliedMigrationNames() {
  const client = new Client({
    connectionString: getDatabaseUrl().toString(),
  });

  await client.connect();

  try {
    if (!(await migrationTableExists())) {
      return new Set();
    }

    const result = await client.query(`
      SELECT migration_name
      FROM ${getQualifiedMigrationTableName()}
      WHERE finished_at IS NOT NULL
        AND rolled_back_at IS NULL
      ORDER BY finished_at ASC
    `);

    return new Set(result.rows.map((row) => row.migration_name));
  } finally {
    await client.end();
  }
}

async function normalizePendingDevelopmentAutoMigrationSql(appEnv) {
  if (appEnv !== "development") {
    return;
  }

  const appliedMigrationNames = await getAppliedMigrationNames();

  for (const migrationName of getMigrationDirectories()) {
    if (
      appliedMigrationNames.has(migrationName) ||
      !isDevelopmentAutoMigrationName(migrationName)
    ) {
      continue;
    }

    const migrationFile = path.join(
      MIGRATIONS_DIR,
      migrationName,
      "migration.sql",
    );

    if (!fs.existsSync(migrationFile)) {
      continue;
    }

    const migrationSql = fs.readFileSync(migrationFile, "utf8");
    const normalizedSql = makeSqlIdempotentForRetry(migrationSql);

    if (normalizedSql !== migrationSql) {
      fs.writeFileSync(migrationFile, normalizedSql, "utf8");
      console.warn(
        `Made pending development auto migration idempotent for missing indexes: ${migrationName}`,
      );
    }
  }
}

function parseUniqueConstraintStatement(statement) {
  const uniqueIndexMatch = statement.match(
    /\bCREATE\s+UNIQUE\s+INDEX(?:\s+CONCURRENTLY)?\s+"([^"]+)"\s+ON\s+((?:"[^"]+"\.)?"[^"]+")\s*(?:USING\s+\w+\s*)?\(([^)]+)\)/i,
  );

  if (uniqueIndexMatch) {
    const tableRef = parseQualifiedTableName(uniqueIndexMatch[2]);
    const columns = parseQuotedIdentifiers(uniqueIndexMatch[3]);

    if (tableRef && columns.length > 0) {
      return {
        name: uniqueIndexMatch[1],
        schema: tableRef.schema,
        table: tableRef.table,
        columns,
      };
    }
  }

  const uniqueConstraintMatch = statement.match(
    /\bALTER\s+TABLE\s+(?:ONLY\s+)?((?:"[^"]+"\.)?"[^"]+")\s+ADD\s+CONSTRAINT\s+"([^"]+)"\s+UNIQUE\s*\(([^)]+)\)/i,
  );

  if (uniqueConstraintMatch) {
    const tableRef = parseQualifiedTableName(uniqueConstraintMatch[1]);
    const columns = parseQuotedIdentifiers(uniqueConstraintMatch[3]);

    if (tableRef && columns.length > 0) {
      return {
        name: uniqueConstraintMatch[2],
        schema: tableRef.schema,
        table: tableRef.table,
        columns,
      };
    }
  }

  return null;
}

function parseForeignKeyConstraintStatement(statement) {
  const foreignKeyMatch = statement.match(
    /\bALTER\s+TABLE\s+(?:ONLY\s+)?((?:"[^"]+"\.)?"[^"]+")\s+ADD\s+CONSTRAINT\s+"([^"]+)"\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+((?:"[^"]+"\.)?"[^"]+")\s*\(([^)]+)\)/i,
  );

  if (!foreignKeyMatch) {
    return null;
  }

  const tableRef = parseQualifiedTableName(foreignKeyMatch[1]);
  const referencedTableRef = parseQualifiedTableName(foreignKeyMatch[4]);
  const columns = parseQuotedIdentifiers(foreignKeyMatch[3]);
  const referencedColumns = parseQuotedIdentifiers(foreignKeyMatch[5]);

  if (
    !tableRef ||
    !referencedTableRef ||
    columns.length === 0 ||
    columns.length !== referencedColumns.length
  ) {
    return null;
  }

  return {
    name: foreignKeyMatch[2],
    schema: tableRef.schema,
    table: tableRef.table,
    columns,
    referencedSchema: referencedTableRef.schema,
    referencedTable: referencedTableRef.table,
    referencedColumns,
  };
}

function findUniqueConstraintStatements(sql) {
  const uniqueConstraints = [];

  for (const statement of splitSqlStatements(stripSqlComments(sql))) {
    const uniqueConstraint = parseUniqueConstraintStatement(statement);

    if (uniqueConstraint) {
      uniqueConstraints.push(uniqueConstraint);
    }
  }

  return uniqueConstraints;
}

function findForeignKeyConstraintStatements(sql) {
  const foreignKeyConstraints = [];

  for (const statement of splitSqlStatements(stripSqlComments(sql))) {
    const foreignKeyConstraint = parseForeignKeyConstraintStatement(statement);

    if (foreignKeyConstraint) {
      foreignKeyConstraints.push(foreignKeyConstraint);
    }
  }

  return foreignKeyConstraints;
}

function removeBlockedUniqueConstraintStatements(sql, blockers) {
  const blockedNames = new Set(blockers.map((blocker) => blocker.name));
  const keptStatements = [];
  const removedStatements = [];

  for (const statement of splitSqlStatements(sql)) {
    const uniqueConstraint = parseUniqueConstraintStatement(
      stripSqlComments(statement),
    );

    if (uniqueConstraint && blockedNames.has(uniqueConstraint.name)) {
      removedStatements.push(uniqueConstraint.name);
      continue;
    }

    keptStatements.push(statement);
  }

  return {
    sql: keptStatements.length > 0 ? `${keptStatements.join(";\n\n")};` : "",
    removedStatements,
  };
}

function removeBlockedForeignKeyConstraintStatements(sql, blockers) {
  const blockedNames = new Set(blockers.map((blocker) => blocker.name));
  const keptStatements = [];
  const removedStatements = [];

  for (const statement of splitSqlStatements(sql)) {
    const foreignKeyConstraint = parseForeignKeyConstraintStatement(
      stripSqlComments(statement),
    );

    if (foreignKeyConstraint && blockedNames.has(foreignKeyConstraint.name)) {
      removedStatements.push(foreignKeyConstraint.name);
      continue;
    }

    keptStatements.push(statement);
  }

  return {
    sql: keptStatements.length > 0 ? `${keptStatements.join(";\n\n")};` : "",
    removedStatements,
  };
}

async function ensureDatabaseExists(appEnv) {
  if (!resolveAutoCreateDatabaseSetting(appEnv)) {
    return;
  }

  const databaseUrl = getDatabaseUrl();
  const databaseName = databaseUrl.pathname.replace(/^\//, "");

  if (!databaseName || databaseName === "postgres") {
    return;
  }

  const adminUrl = new URL(databaseUrl.toString());
  adminUrl.pathname = "/postgres";

  const client = new Client({
    connectionString: adminUrl.toString(),
  });

  await client.connect();

  try {
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [databaseName],
    );

    if (result.rowCount === 0) {
      await client.query(
        `CREATE DATABASE ${toSafeIdentifier(databaseName, "database")}`,
      );
      console.log(`Created database ${databaseName}.`);
      return;
    }

    console.log(`Database ${databaseName} already exists.`);
  } finally {
    await client.end();
  }
}

async function migrationTableExists() {
  const client = new Client({
    connectionString: getDatabaseUrl().toString(),
  });

  await client.connect();

  try {
    const migrationSchemaName = getMigrationSchemaName();

    const tableResult = await client.query(
      "SELECT to_regclass($1) AS table_name",
      [`${migrationSchemaName}._prisma_migrations`],
    );

    return Boolean(tableResult.rows[0]?.table_name);
  } finally {
    await client.end();
  }
}

async function getAppliedMigrations() {
  const client = new Client({
    connectionString: getDatabaseUrl().toString(),
  });

  await client.connect();

  try {
    if (!(await migrationTableExists())) {
      return new Set();
    }

    const result = await client.query(
      `
        SELECT migration_name
        FROM ${getQualifiedMigrationTableName()}
        WHERE finished_at IS NOT NULL
          AND rolled_back_at IS NULL
      `,
    );

    return new Set(result.rows.map((row) => row.migration_name));
  } finally {
    await client.end();
  }
}

async function getFailedMigrations() {
  const client = new Client({
    connectionString: getDatabaseUrl().toString(),
  });

  await client.connect();

  try {
    if (!(await migrationTableExists())) {
      return [];
    }

    const result = await client.query(
      `
        SELECT migration_name, started_at, logs
        FROM ${getQualifiedMigrationTableName()}
        WHERE finished_at IS NULL
          AND rolled_back_at IS NULL
        ORDER BY started_at DESC
      `,
    );

    return result.rows;
  } finally {
    await client.end();
  }
}

async function getUnresolvedFailedMigrationNames(appEnv) {
  const failedMigrations = await getFailedMigrations();

  if (failedMigrations.length === 0) {
    return new Set();
  }

  const message = [
    "Prisma has failed migrations in the database.",
    "",
    ...failedMigrations.map(
      (migration) =>
        `- ${migration.migration_name} started_at=${migration.started_at}`,
    ),
    "",
    "These migrations will be excluded from automatic deploy and startup will stop until they are reviewed.",
    "Set DB_STRICT_MIGRATION_FAILURES=true to fail startup instead.",
  ].join("\n");

  if (resolveStrictMigrationFailureSetting(appEnv)) {
    throw new Error(message);
  }

  console.warn(message);
  return new Set(failedMigrations.map((migration) => migration.migration_name));
}

async function markFailedMigrationRolledBack(migrationName) {
  const client = new Client({
    connectionString: getDatabaseUrl().toString(),
  });

  await client.connect();

  try {
    await client.query(
      `
        UPDATE ${getQualifiedMigrationTableName()}
        SET rolled_back_at = NOW(),
            logs = CONCAT(COALESCE(logs, ''), E'\\nMarked rolled back by development auto-migration recovery.')
        WHERE migration_name = $1
          AND finished_at IS NULL
          AND rolled_back_at IS NULL
      `,
      [migrationName],
    );
  } finally {
    await client.end();
  }
}

function getFailedMigrationRecoveryBlockers(migrationName) {
  if (isDevelopmentAutoMigrationName(migrationName)) {
    return [];
  }

  if (!hasMigrationSql(migrationName)) {
    return ["migration.sql is missing"];
  }

  const migrationSql = fs.readFileSync(getMigrationSqlPath(migrationName), "utf8");
  const destructiveStatements = findDestructiveStatements(migrationSql);

  if (destructiveStatements.length > 0) {
    return [`destructive SQL detected: ${destructiveStatements.join(", ")}`];
  }

  const retryUnsafeStatements = findRetryUnsafeStatements(migrationSql);

  if (retryUnsafeStatements.length > 0) {
    return [`migration is not safely retryable: ${retryUnsafeStatements.join(", ")}`];
  }

  return [];
}

async function rollbackFailedDevelopmentAutoMigrations(appEnv) {
  if (!resolveAutoRollbackFailedAutoMigrationsSetting(appEnv)) {
    return;
  }

  const failedMigrations = await getFailedMigrations();

  if (failedMigrations.length === 0) {
    return;
  }

  const recoverableMigrations = [];
  const blockedMigrations = [];

  for (const migration of failedMigrations) {
    assertMigrationName(migration.migration_name);
    const blockers = getFailedMigrationRecoveryBlockers(migration.migration_name);

    if (blockers.length > 0) {
      blockedMigrations.push(
        `${migration.migration_name}: ${blockers.join("; ")}`,
      );
      continue;
    }

    recoverableMigrations.push(migration);
  }

  if (blockedMigrations.length > 0) {
    console.warn(
      [
        "Some failed migrations were not auto-resolved because retry safety could not be proven:",
        ...blockedMigrations.map((migration) => `- ${migration}`),
      ].join("\n"),
    );
  }

  for (const migration of recoverableMigrations) {
    console.warn(
      `Marking failed development migration as rolled back for retry: ${migration.migration_name}`,
    );
    await markFailedMigrationRolledBack(migration.migration_name);
  }
}

async function tableExists(client, schemaName, tableName) {
  const result = await client.query(
    `
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = $1
        AND table_name = $2
        AND table_type = 'BASE TABLE'
      LIMIT 1
    `,
    [schemaName, tableName],
  );

  return result.rowCount > 0;
}

async function tableColumnsExist(client, schemaName, tableName, columnNames) {
  const result = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = $1
        AND table_name = $2
        AND column_name = ANY($3)
    `,
    [schemaName, tableName, columnNames],
  );

  const existingColumns = new Set(result.rows.map((row) => row.column_name));

  return columnNames.every((columnName) => existingColumns.has(columnName));
}

async function tableColumnExists(client, schemaName, tableName, columnName) {
  return tableColumnsExist(client, schemaName, tableName, [columnName]);
}

function parseSqlStringTuple(tupleText) {
  return [...String(tupleText || "").matchAll(/'((?:''|[^'])*)'/g)].map(
    (match) => match[1].replace(/''/g, "'"),
  );
}

function getRenameMigrationSqlFiles(kind) {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  return getMigrationDirectories()
    .filter((migrationName) => migrationName.includes(kind))
    .map((migrationName) => path.join(MIGRATIONS_DIR, migrationName, "migration.sql"))
    .filter((migrationSqlPath) => fs.existsSync(migrationSqlPath));
}

function parseTableRenameRulesFromSql(migrationSql, source) {
  const rules = [];

  for (const tupleMatch of migrationSql.matchAll(/\(([^()]*'[^()]*'[^()]*)\)/g)) {
    const values = parseSqlStringTuple(tupleMatch[0]);

    if (values.length === 3) {
      rules.push({
        schemaName: values[0],
        oldTable: values[1],
        newTable: values[2],
        source,
      });
    }
  }

  return rules;
}

function loadTableRenameRules() {
  const rules = [];

  for (const migrationSqlPath of getRenameMigrationSqlFiles("rename_tables_camel_case")) {
    const migrationSql = fs.readFileSync(migrationSqlPath, "utf8");
    rules.push(
      ...parseTableRenameRulesFromSql(
        migrationSql,
        path.relative(SERVICE_ROOT, migrationSqlPath),
      ),
    );
  }

  return rules;
}

function parseColumnRenameRulesFromSql(migrationSql, source, tableRenameMap = new Map()) {
  const rules = [];

  for (const tupleMatch of migrationSql.matchAll(/\(([^()]*'[^()]*'[^()]*)\)/g)) {
    const values = parseSqlStringTuple(tupleMatch[0]);

    if (values.length >= 4) {
      const schemaName = values[0];
      const tableName = values[1];
      const renamedTable = tableRenameMap.get(`${schemaName}.${tableName}`);

      rules.push({
        schemaName,
        tableName,
        tableNamesToCheck: [...new Set([tableName, renamedTable].filter(Boolean))],
        oldColumn: values[2],
        newColumn: values[3],
        source,
      });
    }
  }

  return rules;
}

function loadColumnRenameRules(tableRenameMap = new Map()) {
  const rules = [];

  for (const migrationSqlPath of getRenameMigrationSqlFiles("rename_columns_camel_case")) {
    const migrationSql = fs.readFileSync(migrationSqlPath, "utf8");
    rules.push(
      ...parseColumnRenameRulesFromSql(
        migrationSql,
        path.relative(SERVICE_ROOT, migrationSqlPath),
        tableRenameMap,
      ),
    );
  }

  return rules;
}

async function getExistingColumnNames(client, schemaName, tableName, columnNames) {
  const result = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = $1
        AND table_name = $2
        AND column_name = ANY($3)
    `,
    [schemaName, tableName, columnNames],
  );

  return new Set(result.rows.map((row) => row.column_name));
}

function formatRenameCompatibilityProblems(problems, phase) {
  return [
    `Database rename compatibility check failed ${phase}.`,
    "",
    ...problems.map((problem) => `- ${problem}`),
    "",
    "No tables or columns were dropped.",
    "Manual recovery: take a backup, compare row counts/data between the old and new names, merge or rename explicitly, then rerun migrations.",
  ].join("\n");
}

async function assertRenameCompatibility({ phase, requireComplete }) {
  const tableRules = loadTableRenameRules();
  const tableRenameMap = new Map(
    tableRules.map((rule) => [`${rule.schemaName}.${rule.oldTable}`, rule.newTable]),
  );
  const columnRules = loadColumnRenameRules(tableRenameMap);
  const problems = [];

  if (tableRules.length === 0 && columnRules.length === 0) {
    return;
  }

  const client = new Client({
    connectionString: getDatabaseUrl().toString(),
  });

  await client.connect();

  try {
    for (const rule of tableRules) {
      const oldExists = await tableExists(client, rule.schemaName, rule.oldTable);
      const newExists = await tableExists(client, rule.schemaName, rule.newTable);

      if (oldExists && newExists) {
        problems.push(
          `${rule.schemaName}.${rule.oldTable} and ${rule.schemaName}.${rule.newTable} both exist.`,
        );
      }

      if (requireComplete) {
        if (oldExists) {
          problems.push(
            `Table ${rule.schemaName}.${rule.oldTable} has not been dropped/renamed.`,
          );
        }
        if (!newExists) {
          problems.push(
            `Renamed table ${rule.schemaName}.${rule.newTable} does not exist.`,
          );
        }
      }
    }

    for (const rule of columnRules) {
      for (const tableName of rule.tableNamesToCheck) {
        if (await tableExists(client, rule.schemaName, tableName)) {
          const existingColumns = await getExistingColumnNames(
            client,
            rule.schemaName,
            tableName,
            [rule.oldColumn, rule.newColumn],
          );
          const oldExists = existingColumns.has(rule.oldColumn);
          const newExists = existingColumns.has(rule.newColumn);

          if (oldExists && newExists) {
            problems.push(
              `${rule.schemaName}.${tableName} has both old column "${rule.oldColumn}" and new column "${rule.newColumn}".`,
            );
          }

          if (requireComplete) {
            if (oldExists) {
              problems.push(
                `${rule.schemaName}.${tableName} still has old column "${rule.oldColumn}".`,
              );
            }
            if (!newExists) {
              problems.push(
                `${rule.schemaName}.${tableName} is missing new column "${rule.newColumn}".`,
              );
            }
          }
        }
      }
    }

    if (problems.length > 0) {
      throw new Error(formatRenameCompatibilityProblems(problems, phase));
    }
  } finally {
    await client.end();
  }
}

async function main() {
  const appEnv = loadEnvironment();
  const syncStrategy = resolveSyncStrategy(appEnv);

  console.log(`Starting DB bootstrap... Env: ${appEnv}, Strategy: ${syncStrategy}`);

  await resolveReachableDevelopmentDatabaseUrl(appEnv);
  const dbUrl = getDatabaseUrl();

  console.log(`Verifying database connectivity to host: ${dbUrl.host}...`);
  await assertDatabaseServerReachable(dbUrl);

  await ensureDatabaseExists(appEnv);

  if (syncStrategy === "push") {
    console.log("Running prisma db push...");
    runPrisma(["db", "push", "--skip-generate"]);
    console.log("Generating Prisma Client...");
    runPrisma(["generate"]);
    console.log("DB sync complete.");
    return;
  }

  // migrate strategy
  await rollbackFailedDevelopmentAutoMigrations(appEnv);
  const unresolvedFailed = await getUnresolvedFailedMigrationNames(appEnv);

  console.log("Validating rename compatibility before migration...");
  await assertRenameCompatibility({ phase: "before", requireComplete: false });

  await withMigrationLock(async () => {
    console.log("Generating Prisma Client...");
    runPrisma(["generate"]);

    console.log("Validating Prisma schema...");
    runPrisma(["validate"]);

    if (resolveAutoBaselineSetting(appEnv)) {
      const appliedMigrations = await getAppliedMigrations();
      const migrationDirs = getMigrationDirectories();
      const pendingMigrations = migrationDirs.filter(
        (m) => !appliedMigrations.has(m) && !unresolvedFailed.has(m)
      );

      if (pendingMigrations.length > 0) {
        console.log(`Evaluating baseline state for ${pendingMigrations.length} pending migrations...`);
        const toBaseline = [];
        
        const client = new Client({ connectionString: dbUrl.toString() });
        await client.connect();

        try {
          for (const migration of pendingMigrations) {
            const state = await evaluateMigrationBaselineState(client, migration);
            if (state.baseline) {
              toBaseline.push(migration);
            }
          }
        } finally {
          await client.end();
        }

        for (const migration of toBaseline) {
          console.log(`Baselining migration: ${migration}`);
          runPrisma(["migrate", "resolve", "--applied", migration]);
        }
      }
    }

    if (resolveAutoApplySetting()) {
      console.log("Applying pending migrations...");
      const workspace = createMigrationWorkspace(appEnv, {
        excludeMigrationNames: unresolvedFailed,
      });
      try {
        if (workspace.migrationNames.length > 0) {
          for (const migration of workspace.migrationNames) {
            const sqlPath = getMigrationSqlPath(migration);
            if (fs.existsSync(sqlPath)) {
              const sql = fs.readFileSync(sqlPath, "utf8");
              assertSqlIsSafeForAutoApply(sql, migration);
            }
          }
          runPrisma(["migrate", "deploy"], { configPath: workspace.configPath });
        } else {
          console.log("No pending migrations to deploy.");
        }
      } finally {
        cleanupMigrationWorkspace(workspace);
      }
    } else {
      console.log("Skipping automatic migration deployment (DB_AUTO_APPLY=false).");
    }

    if (syncStrategy === "migrate-dev" && appEnv === "development") {
      console.log("Normalizing pending dev auto-migrations...");
      await normalizePendingDevelopmentAutoMigrationSql(appEnv);
      
      console.log("Running prisma migrate dev...");
      try {
        runPrisma(["migrate", "dev", "--skip-generate", "--skip-seed"]);
      } catch (err) {
        console.warn("Prisma migrate dev completed with prompt or skipped due to interactive requirements.");
      }
    }
  });

  console.log("Validating rename compatibility after migration...");
  await assertRenameCompatibility({ phase: "after", requireComplete: true });

  console.log("Database bootstrap successfully completed!");
}

module.exports = {
  bootstrap: main,
  runPrisma,
  getPrismaCliPath,
  assertRenameCompatibility,
};

if (require.main === module) {
  main().catch((error) => {
    console.error("Database bootstrap failed:", error);
    process.exit(1);
  });
}
