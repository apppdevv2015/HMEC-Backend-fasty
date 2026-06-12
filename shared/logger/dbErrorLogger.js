const { getLoggingPrisma } = require("./loggingPrisma");
const { getContext } = require("./requestContext.middleware");

function normalizeDuration(duration) {
  if (duration === undefined || duration === null) return null;

  if (typeof duration === "number" && Number.isFinite(duration)) {
    return Math.floor(duration);
  }

  if (typeof duration === "string") {
    const msMatch = duration.match(/^\s*(\d+)\s*ms\s*$/i);
    if (msMatch) return parseInt(msMatch[1], 10);

    const parsed = parseInt(duration, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return null;
}

function sanitizeObject(value) {
  if (!value || typeof value !== "object") return value || null;

  const blockedKeys = [
    "password",
    "confirmpassword",
    "confirmPassword",
    "token",
    "accesstoken",
    "accessToken",
    "refreshtoken",
    "refreshToken",
    "authorization",
    "otp",
  ];

  const safe = Array.isArray(value) ? [...value] : { ...value };

  for (const key of Object.keys(safe)) {
    if (blockedKeys.includes(key.toLowerCase())) {
      safe[key] = "[REDACTED]";
    }
  }

  return safe;
}

async function logErrorToDB(error, meta = {}) {
  try {
    if (process.env.ENABLE_DB_LOGGING !== "true") return;

    const loggingPrisma = getLoggingPrisma();

    if (!loggingPrisma) return;

    const context = getContext();
    const url = meta.url || meta.path || context.url || "";

    if (
      url &&
      (url.toLowerCase().includes("health") ||
        url.toLowerCase().includes("favicon"))
    ) {
      return;
    }

    await loggingPrisma.log.create({
      data: {
        level: "error",
        message: String(error?.message || meta.message || "Error").substring(
          0,
          2000
        ),

        service:
          meta.service ||
          context.service ||
          meta.serviceName ||
          process.env.SERVICE_NAME ||
          "unknown-service",

        module: meta.module || null,
        action: meta.action || null,

        requestId: meta.requestId || context.requestId || null,
        correlationId: meta.correlationId || context.correlationId || null,

        userId: meta.userId || context.userId || null,
        userRole: meta.userRole || context.userRole || null,
        companyId: meta.companyId || context.companyId || meta.schoolId || null,

        error: String(error?.message || meta.error || "Error").substring(
          0,
          2000
        ),
        errorCode: error?.code || meta.errorCode || meta.prismaCode || null,

        stack: error?.stack
          ? String(error.stack).substring(0, 4000)
          : meta.stack
            ? String(meta.stack).substring(0, 4000)
            : null,
        status: meta.status || meta.statusCode || error?.statusCode || null,
        method: meta.method || context.method || null,
        url: url || null,
        duration: normalizeDuration(meta.duration || meta.durationMs),

        ipAddress: meta.ipAddress || meta.ip || context.ipAddress || null,
        userAgent: meta.userAgent || context.userAgent || null,

        metadata: sanitizeObject({
          params: meta.metadata?.params || null,
          query: meta.metadata?.query || null,
          body: meta.metadata?.body || null,
          clientVersion: error?.clientVersion || meta.clientVersion || null,
          details: meta.metadata || null,
        }),
      },
    });
  } catch (dbError) {
    console.error("DB Log Failed:", {
      message: error?.message,
      dbError: dbError.message,
    });
  }
}


async function logToDB(level, message, meta = {}) {
  if (level !== "error") return;

  const errorLike = meta.originalError || meta.error;

  const error =
    errorLike instanceof Error
      ? errorLike
      : {
        message: meta.error || message,
        stack: meta.stack || null,
        code: meta.errorCode || meta.code || null,
        statusCode: meta.statusCode || meta.status || null,
      };

  return logErrorToDB(error, {
    ...meta,
    message,
  });
}

module.exports = {
  logErrorToDB,
  logToDB,
};
