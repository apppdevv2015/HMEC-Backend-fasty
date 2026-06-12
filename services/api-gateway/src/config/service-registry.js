const ALLOWED_SERVICE_PROTOCOLS = new Set(['http:', 'https:']);
const BLOCKED_DOWNSTREAM_PORTS = new Set(['6379']);

function normalizeServiceUrl(url) {
  const value = String(url || '').trim().replace(/\/+$/, '');

  if (!value) {
    return '';
  }

  try {
    const parsed = new URL(value);

    if (!ALLOWED_SERVICE_PROTOCOLS.has(parsed.protocol)) {
      return '';
    }

    if (BLOCKED_DOWNSTREAM_PORTS.has(parsed.port)) {
      return '';
    }

    return value;
  } catch (_error) {
    return '';
  }
}

function getServiceRegistry() {
  return {
    intelligence: normalizeServiceUrl(process.env.INTELLIGENCE_SERVICE_URL),
    auth: normalizeServiceUrl(process.env.AUTH_SERVICE_URL),
    fleet: normalizeServiceUrl(process.env.FLEET_SERVICE_URL),
    ingestion: normalizeServiceUrl(process.env.INGESTION_SERVICE_URL),
    notifications: normalizeServiceUrl(process.env.NOTIFICATION_SERVICE_URL),
  };
}

module.exports = {
  getServiceRegistry,
};
