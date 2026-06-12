const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

function resolveAppEnv() {
  return process.env.APP_ENV || process.env.NODE_ENV || "development";
}

function loadEnvironment() {
  const appEnv = resolveAppEnv();

  const envFileMap = {
    development: ".env.development",
    staging: ".env.staging",
    production: ".env.production",
  };

  const selectedEnvFile = envFileMap[appEnv] || ".env.development";
  const localEnvPath = path.resolve(__dirname, "../../", ".env.local");
  const envPath = path.resolve(__dirname, "../../", selectedEnvFile);
  const fallbackEnvPath = path.resolve(__dirname, "../../", ".env");

  let envLoaded = false;

  if (fs.existsSync(fallbackEnvPath)) {
    dotenv.config({ path: fallbackEnvPath, quiet: true });
    console.log("Loaded base environment from .env");
    envLoaded = true;
  }

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, quiet: true, override: true });
    console.log(`Loaded environment overrides from ${selectedEnvFile}`);
    envLoaded = true;
  }

  if (process.env.LOCAL_DEV === "true" && fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath, quiet: true, override: true });
    console.log("Loaded environment from .env.local");
    envLoaded = true;
  }

  if (!envLoaded) {
    dotenv.config({ quiet: true });
    console.warn("No env file found. Using existing process environment.");
  }

  process.env.APP_ENV = appEnv;

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = appEnv === "production" ? "production" : "development";
  }

  return appEnv;
}

module.exports = {
  loadEnvironment,
  resolveAppEnv,
};
