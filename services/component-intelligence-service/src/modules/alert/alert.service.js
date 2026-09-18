const alertRepository = require("./alert.repository");
const { createClient } = require("redis");
const prisma = require("../../database/prismaClient");
const { notifyUser, notifyRoles } = require("../../../../../shared/notifications/notificationPublisher");
const redisModule = require("../../../../auth-service/src/redis/redis.client");

async function publishAlertToRedis(channel, payload) {
  const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
  const client = createClient({
    url: redisUrl,
    RESP: 2,
    socket: { connectTimeout: 2000, reconnectStrategy: false },
  });
  client.on("error", (err) =>
    console.error("[Redis Error]", err.message || err),
  );
  try {
    await client.connect();
    await client.publish(channel, JSON.stringify(payload));
  } catch (error) {
    console.error("[ALERT_REDIS_PUBLISH_ERROR]:", error.message);
  } finally {
    try {
      await client.disconnect();
    } catch (e) {}
  }
}

function buildAlertMessage({
  machineName,
  componentName,
  previousHealth,
  currentHealth,
  parameterChanges,
  issues,
}) {
  const relevantChange = Array.isArray(parameterChanges)
    ? parameterChanges.find(
        (p) => !p.componentName || p.componentName === componentName,
      )
    : null;

  if (relevantChange) {
    return (
      `${componentName} health on ${machineName} dropped from ${previousHealth}% to ${currentHealth}%. ` +
      `${relevantChange.parameterName} changed from ${relevantChange.previousValue}${relevantChange.unit || ""} to ` +
      `${relevantChange.updatedValue}${relevantChange.unit || ""}` +
      (relevantChange.safeMin !== undefined &&
      relevantChange.safeMax !== undefined
        ? `, which is outside the configured safe range (${relevantChange.safeMin}-${relevantChange.safeMax}${relevantChange.unit || ""}).`
        : ".")
    );
  }

  if (Array.isArray(issues) && issues.length > 0) {
    return `${componentName} health on ${machineName} dropped from ${previousHealth}% to ${currentHealth}%. ${issues[0]}`;
  }

  return `${componentName} health on ${machineName} dropped from ${previousHealth}% to ${currentHealth}%.`;
}

class AlertService {
  async evaluate({
    companyId,
    machineId,
    machineName,
    componentName,
    parameterName,
    previousHealth,
    currentHealth,
    status,
    parameterChanges,
    issues,
  }) {
    try {
      if (status !== "Critical" && status !== "Warning") {
        return null;
      }

      const hasPrevious =
        previousHealth !== null && previousHealth !== undefined;
      const healthDrop = hasPrevious ? previousHealth - currentHealth : 0;

      const message = hasPrevious
        ? buildAlertMessage({
            machineName,
            componentName,
            previousHealth,
            currentHealth,
            parameterChanges,
            issues,
          })
        : `${componentName} on ${machineName} failed pre-start inspection with ${status} condition (Health: ${currentHealth}%).`;

      const relevantChange = Array.isArray(parameterChanges)
        ? parameterChanges.find(
            (p) => !p.componentName || p.componentName === componentName,
          )
        : null;
      const alert = await alertRepository.create({
        companyId,
        machineId,
        componentName,
        parameterName: relevantChange?.parameterName || parameterName || null,
        previousHealth: hasPrevious ? previousHealth : currentHealth,
        currentHealth,
        healthDrop,
        status,
        message,
        parameterDetails: relevantChange || null,
      });

      let assignedUserIds = [];
      try {
        const machine = await prisma.machine.findUnique({
          where: { id: machineId },
          select: {
            assignedOperatorId: true,
            assignedArtisanId: true,
            assignedSupervisorId: true,
          },
        });
        if (machine) {
          assignedUserIds = [
            machine.assignedOperatorId,
            machine.assignedArtisanId,
            machine.assignedSupervisorId,
          ].filter(Boolean);
        }
      } catch (lookupErr) {
        console.error("[ALERT_MACHINE_LOOKUP_ERROR]:", lookupErr.message);
      }

           const uniqueUserIds = [...new Set(assignedUserIds)];

      const alertPayload = {
        id: alert.id,
        machineId,
        componentName,
        message,
        status,
        healthDrop,
        createdAt: alert.createdAt,
      };

      for (const userId of uniqueUserIds) {
        await publishAlertToRedis(`user:${userId}:alerts`, alertPayload);

        await notifyUser(prisma, redisModule, {
          companyId,
          userId,
          title: `${status} Alert: ${componentName}`,
          message,
          type: 'Alert',
          severity: status === 'Critical' ? 'critical' : 'warning',
          entityType: 'Machine',
          entityId: machineId,
        });
      }

      await notifyRoles(prisma, redisModule, {
        companyId,
        roles: ['ADMIN', 'SUB_ADMIN'],
        title: `${status} Alert: ${componentName}`,
        message,
        type: 'Alert',
        severity: status === 'Critical' ? 'critical' : 'warning',
        entityType: 'Machine',
        entityId: machineId,
      });

      return alert;

    } catch (error) {
      console.error("[ALERT_EVALUATE_ERROR]:", error.message);
      return null;
    }
  }
}

module.exports = new AlertService();
