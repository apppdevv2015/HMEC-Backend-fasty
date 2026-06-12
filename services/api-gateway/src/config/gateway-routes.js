const DEFAULT_NAMESPACE_ROUTES = Object.freeze([
  {
    name: 'auth',
    prefix: '/auth',
    serviceName: 'auth',
    sourcePrefix: '/api/v1/auth',
    targetPrefix: '',
    rateLimit: 'standard',
    auth: 'gatewayExceptHealth',
  },
  {
    name: 'intelligence',
    prefix: '/intelligence',
    serviceName: 'intelligence',
    sourcePrefix: '/api/v1/intelligence',
    targetPrefix: '',
    rateLimit: 'standard',
    auth: 'gatewayExceptHealth',
  },
  {
    name: 'fleet',
    prefix: '/fleet',
    serviceName: 'fleet',
    sourcePrefix: '/api/v1/fleet',
    targetPrefix: '',
    rateLimit: 'standard',
    auth: 'gatewayExceptHealth',
  },
  {
    name: 'ingestion',
    prefix: '/ingestion',
    serviceName: 'ingestion',
    sourcePrefix: '/api/v1/ingestion',
    targetPrefix: '',
    rateLimit: 'standard',
    auth: 'gatewayExceptHealth',
  },
  {
    name: 'notifications',
    prefix: '/notifications',
    serviceName: 'notifications',
    sourcePrefix: '/api/v1/notifications',
    targetPrefix: '',
    rateLimit: 'standard',
    auth: 'gatewayExceptHealth',
  },
]);

function normalizePrefix(value) {
  const clean = String(value || '').trim().replace(/^\/+|\/+$/g, '');
  return clean ? `/${clean}` : null;
}

function parseNamespaceRoutes(rawValue) {
  const raw = String(rawValue || '').trim();

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed
      .map((route) => ({
        name: route.name || route.serviceName,
        prefix: normalizePrefix(route.prefix),
        serviceName: route.serviceName,
        sourcePrefix: normalizePrefix(route.sourcePrefix),
        targetPrefix: normalizePrefix(route.targetPrefix || '/api/v1'),
        rateLimit: route.rateLimit || 'standard',
        auth: route.auth || 'gateway',
      }))
      .filter((route) => route.prefix && route.serviceName && route.sourcePrefix && route.targetPrefix);
  } catch (_error) {
    return null;
  }
}

function getNamespaceRoutes(serviceRegistry, env = process.env) {
  const configuredRoutes = parseNamespaceRoutes(env.GATEWAY_NAMESPACE_ROUTES);
  const routes = configuredRoutes || DEFAULT_NAMESPACE_ROUTES;

  return routes.map((route) => ({
    ...route,
    target: serviceRegistry[route.serviceName],
    type: 'namespace',
  }));
}

function getDirectRouteDiscoveryServices(serviceRegistry, env = process.env) {
  const configuredServiceNames = String(env.GATEWAY_DIRECT_DISCOVERY_SERVICES || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const serviceNames = configuredServiceNames.length > 0
    ? configuredServiceNames
    : Object.keys(serviceRegistry).filter((serviceName) => serviceName !== 'cms');

  return serviceNames
    .map((serviceName) => ({
      serviceName,
      target: serviceRegistry[serviceName],
    }))
    .filter((service) => service.target);
}

function getGatewayRouteDefinitions(serviceRegistry, env = process.env) {
  return getNamespaceRoutes(serviceRegistry, env);
}

module.exports = {
  getDirectRouteDiscoveryServices,
  getGatewayRouteDefinitions,
};
