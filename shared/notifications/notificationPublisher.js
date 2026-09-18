const SUPER_ADMIN_CHANNEL = "role:SUPER_ADMIN:alerts";
const GLOBAL_CHANNEL = "alerts:global";

const normalizeRole = (role) =>
  String(role || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const isSuperAdminRole = (role) => normalizeRole(role) === "superadmin";

const resolveChannel = ({ userId, companyId, role }) => {
  if (userId) return `user:${userId}:alerts`;
  if (isSuperAdminRole(role)) return SUPER_ADMIN_CHANNEL;
  if (companyId && role)
    return `company:${companyId}:role:${normalizeRole(role)}:alerts`;
  return null;
};

const normalizeRoleForStorage = (role) =>
  String(role || "").toUpperCase().trim().replace(/[\s-]+/g, "_");

async function notifyUser(
  prisma,
  redisModule,
  {
    companyId = null,
    userId = null,
    role = null,
    title,
    message,
    type,
    severity = "info",
    actorId = null,
    actorName = null,
    actorRole = null,
    entityType = null,
    entityId = null,
    link = null,
  },
) {
  if (!userId && !role) {
    console.warn("[NOTIFY] Skipped: neither userId nor role provided", { type });
    return null;
  }

  const notification = await prisma.notification.create({
    data: {
      ...(companyId ? { company: { connect: { id: companyId } } } : {}),
      userId: userId,
      role: role ? normalizeRoleForStorage(role) : null,
      title,
      message,
      type,
      severity,
      actor_id: actorId,
      actor_name: actorName,
      actor_role: actorRole,
      entity_type: entityType,
      entity_id: entityId,
      link,
    },
  });
  try {
    const channel = resolveChannel({ userId, companyId, role });
    if (!channel) {
      console.warn("[NOTIFY] No channel resolved, DB-only", { userId, companyId, role });
      return notification;
    }

    const client = await redisModule.ensureRedisConnected();
    await client.publish(channel, JSON.stringify(notification));
    console.log(`[NOTIFY] Published ${type} -> ${channel}`);
  } catch (err) {
    console.error("[NOTIFY] Redis publish failed (DB row saved):", err.message);
  }

  return notification;
}

async function notifySuperAdmins(prisma, redisModule, payload) {
  return notifyUser(prisma, redisModule, {
    ...payload,
    userId: null,
    companyId: payload.companyId ?? null,
    role: "super_admin",
  });
}

async function notifyRoles(prisma, redisModule, { companyId, roles = [], title, message, type, severity = "info", actorId, actorName, actorRole, entityType, entityId }) {
  const results = [];
  for (const r of roles) {
    const n = await notifyUser(prisma, redisModule, {
      companyId, role: r, title, message, type, severity,
      actorId, actorName, actorRole, entityType, entityId,
    });
    results.push(n);
  }
  return results;
}

module.exports = {
  notifyUser,
  notifyRoles,
  notifySuperAdmins,
  normalizeRole,
  normalizeRoleForStorage,
  isSuperAdminRole,
  SUPER_ADMIN_CHANNEL,
  GLOBAL_CHANNEL,
};