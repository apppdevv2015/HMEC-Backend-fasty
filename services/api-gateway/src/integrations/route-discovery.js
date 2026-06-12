const axios = require('axios');
const { buildInternalHeaders } = require('../config/internal-request');
const { getServiceAgent } = require('./service-client');
const { AppError } = require('../runtime');

const DISCOVERY_TIMEOUT_MS = Number(process.env.GATEWAY_ROUTE_DISCOVERY_TIMEOUT_MS || 3000);
const DISCOVERY_TTL_MS = Number(process.env.GATEWAY_ROUTE_DISCOVERY_TTL_MS || 60000);
const DISCOVERY_STALE_IF_ERROR_MS = Number(process.env.GATEWAY_ROUTE_DISCOVERY_STALE_IF_ERROR_MS || 5 * 60 * 1000);
const ROUTE_MANIFEST_PATH = process.env.GATEWAY_ROUTE_MANIFEST_PATH || '/.well-known/ira-routes';
const OPENAPI_PATH = process.env.GATEWAY_ROUTE_DISCOVERY_OPENAPI_PATH || '/openapi.json';
const HTTP_METHODS = new Set(['delete', 'get', 'head', 'options', 'patch', 'post', 'put']);
const GATEWAY_API_PREFIX = '/api/v1';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compileOpenApiPath(pathName) {
  const segments = String(pathName || '')
    .split('/')
    .filter(Boolean);
  let staticScore = 0;
  let paramScore = 0;

  const pattern = segments.map((segment) => {
    if (
      (segment.startsWith('{') && segment.endsWith('}')) ||
      segment.startsWith(':')
    ) {
      paramScore += 1;
      return '[^/]+';
    }

    staticScore += segment.length;
    return escapeRegex(segment);
  }).join('/');

  return {
    regex: new RegExp(`^/${pattern}/?$`),
    score: staticScore * 10 - paramScore,
  };
}

function normalizeDiscoveredPath(pathName) {
  const rawPath = String(pathName || '').trim();

  if (!rawPath) {
    return '';
  }

  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

  if (normalizedPath === GATEWAY_API_PREFIX || normalizedPath.startsWith(`${GATEWAY_API_PREFIX}/`)) {
    return normalizedPath;
  }

  return `${GATEWAY_API_PREFIX}${normalizedPath}`.replace(/\/{2,}/g, '/');
}

function normalizeIncomingGatewayPath(pathName) {
  const normalizedPath = String(pathName || '/').replace(/\/+$/, '') || '/';

  if (normalizedPath === GATEWAY_API_PREFIX || normalizedPath.startsWith(`${GATEWAY_API_PREFIX}/`)) {
    return normalizedPath;
  }

  return `${GATEWAY_API_PREFIX}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`
    .replace(/\/{2,}/g, '/');
}

function extractRoutesFromSpec(spec, service) {
  const paths = spec?.paths && typeof spec.paths === 'object' ? spec.paths : {};

  return Object.entries(paths).flatMap(([pathName, operations]) => {
    const normalizedPath = normalizeDiscoveredPath(pathName);

    if (!normalizedPath || normalizedPath.includes('/health/')) {
      return [];
    }

    const methods = Object.keys(operations || {})
      .filter((method) => HTTP_METHODS.has(method.toLowerCase()))
      .map((method) => method.toUpperCase());

    if (methods.length === 0) {
      return [];
    }

    const compiled = compileOpenApiPath(normalizedPath);

    return [{
      pathName: normalizedPath,
      methods: new Set(methods),
      regex: compiled.regex,
      score: compiled.score,
      serviceName: service.serviceName,
      target: service.target,
    }];
  });
}

function extractRoutesFromManifest(payload, service) {
  const routes = Array.isArray(payload?.routes)
    ? payload.routes
    : Array.isArray(payload?.data?.routes)
      ? payload.data.routes
      : [];

  return routes.flatMap((route) => {
    const pathName = normalizeDiscoveredPath(route.path || route.url);
    const methods = Array.isArray(route.methods) ? route.methods : [route.method];

    if (!pathName || pathName.includes('/health/')) {
      return [];
    }

    const normalizedMethods = methods
      .map((method) => String(method || '').toUpperCase())
      .filter((method) => HTTP_METHODS.has(method.toLowerCase()));

    if (normalizedMethods.length === 0) {
      return [];
    }

    const compiled = compileOpenApiPath(pathName);

    return [{
      pathName,
      methods: new Set(normalizedMethods),
      regex: compiled.regex,
      score: compiled.score,
      serviceName: service.serviceName,
      target: service.target,
    }];
  });
}

function createDiscoveryClient(target) {
  const agent = getServiceAgent(target);

  return axios.create({
    baseURL: target,
    timeout: DISCOVERY_TIMEOUT_MS,
    httpAgent: agent,
    httpsAgent: agent,
    validateStatus: () => true,
  });
}

async function discoverServiceRoutes(service, request) {
  const client = createDiscoveryClient(service.target);
  const manifestResponse = await client.get(ROUTE_MANIFEST_PATH, {
    headers: buildInternalHeaders(request),
  });

  if (manifestResponse.status < 400) {
    const manifestRoutes = extractRoutesFromManifest(manifestResponse.data, service);

    if (manifestRoutes.length > 0) {
      return manifestRoutes;
    }
  }

  const openApiResponse = await client.get(OPENAPI_PATH, {
    headers: buildInternalHeaders(request),
  });

  if (openApiResponse.status >= 400) {
    request.log.warn({
      event: 'gateway_route_discovery_failed',
      service: service.serviceName,
      target: service.target,
      routeManifestStatusCode: manifestResponse.status,
      openApiStatusCode: openApiResponse.status,
    });
    return [];
  }

  return extractRoutesFromSpec(openApiResponse.data, service);
}

function chooseBestMatch(routes, method, pathName) {
  const effectiveMethod = method === 'HEAD' ? 'GET' : method;
  const matches = routes
    .filter((route) => (
      route.regex.test(pathName) &&
      route.methods.has(effectiveMethod)
    ))
    .sort((left, right) => right.score - left.score);

  return matches[0] || null;
}

function dedupeRoutes(routes, request) {
  const byMethodAndPath = new Map();

  for (const route of routes) {
    for (const method of route.methods) {
      const key = `${method} ${route.pathName}`;
      const existing = byMethodAndPath.get(key);

      if (existing && existing.serviceName !== route.serviceName) {
        request.log.warn({
          event: 'gateway_route_discovery_conflict',
          method,
          path: route.pathName,
          selectedService: existing.serviceName,
          ignoredService: route.serviceName,
        });
        continue;
      }

      byMethodAndPath.set(key, {
        ...route,
        methods: new Set([method]),
      });
    }
  }

  return Array.from(byMethodAndPath.values());
}

function createRouteDiscoveryResolver(services, options = {}) {
  const ttlMs = Number(options.ttlMs || DISCOVERY_TTL_MS);
  let cache = {
    expiresAt: 0,
    refreshedAt: 0,
    stale: false,
    routes: [],
  };
  let refreshPromise = null;

  async function refresh(request) {
    const discovered = await Promise.allSettled(
      services.map((service) => discoverServiceRoutes(service, request))
    );

    discovered.forEach((result, index) => {
      if (result.status === 'rejected') {
        const service = services[index];
        request.log.warn({
          event: 'gateway_route_discovery_error',
          service: service?.serviceName,
          target: service?.target,
          error: result.reason?.message || result.reason?.code || String(result.reason),
        });
      }
    });

    const routes = discovered.flatMap((result) => (
      result.status === 'fulfilled' ? result.value : []
    ));

    if (routes.length === 0 && cache.routes.length > 0) {
      request.log.warn({
        event: 'gateway_route_discovery_using_stale_cache',
        staleRouteCount: cache.routes.length,
      });

      cache = {
        ...cache,
        expiresAt: Date.now() + Math.min(ttlMs, DISCOVERY_STALE_IF_ERROR_MS),
        stale: true,
      };

      return cache.routes;
    }

    cache = {
      expiresAt: Date.now() + ttlMs,
      refreshedAt: Date.now(),
      stale: false,
      routes: dedupeRoutes(routes, request),
    };

    return cache.routes;
  }

  async function getRoutes(request) {
    if (cache.expiresAt > Date.now() && cache.routes.length > 0) {
      return cache.routes;
    }

    if (!refreshPromise) {
      refreshPromise = refresh(request).finally(() => {
        refreshPromise = null;
      });
    }

    return refreshPromise;
  }

  async function healthCheck(request) {
    const routes = await getRoutes(request);

    if (routes.length === 0) {
      throw AppError.serviceUnavailable('Gateway route discovery has no available routes.');
    }

    return {
      status: cache.stale ? 'stale' : 'ready',
      routeCount: routes.length,
      refreshedAt: cache.refreshedAt || null,
      expiresAt: cache.expiresAt || null,
    };
  }

  async function resolveDirectRoute(request) {
    const rawPathName = String(request.originalUrl || request.url || '/').split('?')[0];
    const pathName = normalizeIncomingGatewayPath(rawPathName);
    const method = String(request.method || 'GET').toUpperCase();
    const routes = await getRoutes(request);
    const match = chooseBestMatch(routes, method, pathName);

    if (!match) {
      if (routes.length === 0) {
        throw AppError.serviceUnavailable('Gateway route discovery is temporarily unavailable.');
      }

      throw AppError.notFound(`API route not found: ${method} ${pathName}`);
    }

    return {
      target: match.target,
      serviceName: match.serviceName,
      targetPrefix: '/api/v1',
    };
  }

  resolveDirectRoute.healthCheck = healthCheck;
  resolveDirectRoute.getSnapshot = () => ({ ...cache, routes: [...cache.routes] });

  return resolveDirectRoute;
}

module.exports = {
  createRouteDiscoveryResolver,
};
