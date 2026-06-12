const http = require('http');
const https = require('https');
const axios = require('axios');
const { getServiceRegistry } = require('../config/service-registry');
const { AppError, createCircuitBreaker } = require('../runtime');

const DEFAULT_TIMEOUT_MS = Number(process.env.SERVICE_REQUEST_TIMEOUT_MS || 15000);
const DEFAULT_KEEP_ALIVE_MS = Number(process.env.SERVICE_KEEP_ALIVE_MS || 10000);
const DEFAULT_MAX_SOCKETS = Number(process.env.SERVICE_MAX_SOCKETS || 256);
const DEFAULT_MAX_FREE_SOCKETS = Number(process.env.SERVICE_MAX_FREE_SOCKETS || 32);

const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: DEFAULT_KEEP_ALIVE_MS,
  maxSockets: DEFAULT_MAX_SOCKETS,
  maxFreeSockets: DEFAULT_MAX_FREE_SOCKETS,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: DEFAULT_KEEP_ALIVE_MS,
  maxSockets: DEFAULT_MAX_SOCKETS,
  maxFreeSockets: DEFAULT_MAX_FREE_SOCKETS,
});

const serviceClients = new Map();
const IDEMPOTENT_METHODS = new Set(['get', 'head', 'options', 'delete']);

function assertTargetConfigured(serviceName, target) {
  if (!target) {
    throw new Error(`Missing service target configuration for ${serviceName}.`);
  }

  return target;
}

function createServiceHttpClient(target) {
  return axios.create({
    baseURL: target,
    timeout: DEFAULT_TIMEOUT_MS,
    httpAgent,
    httpsAgent,
  });
}

function shouldRetry(error) {
  const status = error.response?.status;

  return (
    error.code === 'ECONNRESET' ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    status === 408 ||
    status === 429 ||
    status >= 500
  );
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(baseDelayMs, retryCount) {
  const jitterMs = Math.floor(Math.random() * Math.max(1, baseDelayMs));
  return baseDelayMs * 2 ** retryCount + jitterMs;
}

function attachResilience(client, serviceName) {
  const breaker = createCircuitBreaker(`service-client:${serviceName}`);
  const retryAttempts = Number(process.env.SERVICE_RETRY_ATTEMPTS || 2);
  const retryBaseDelayMs = Number(process.env.SERVICE_RETRY_BASE_DELAY_MS || 100);

  client.interceptors.request.use((config) => {
    if (!breaker.canRequest()) {
      throw AppError.serviceUnavailable('Downstream service is temporarily unavailable.');
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => {
      breaker.recordSuccess();
      return response;
    },
    async (error) => {
      const config = error.config;
      const method = String(config?.method || 'get').toLowerCase();
      const canRetryMethod = IDEMPOTENT_METHODS.has(method) || config?.idempotent === true;
      const retryCount = config?.__retryCount || 0;

      if (config && canRetryMethod && retryCount < retryAttempts && shouldRetry(error)) {
        config.__retryCount = retryCount + 1;
        await delay(retryDelay(retryBaseDelayMs, retryCount));
        return client(config);
      }

      breaker.recordFailure(error);
      return Promise.reject(error);
    }
  );
}

function getServiceAgent(target) {
  return String(target || '').startsWith('https://') ? httpsAgent : httpAgent;
}

function getServiceClient(serviceName) {
  if (serviceClients.has(serviceName)) {
    return serviceClients.get(serviceName);
  }

  const registry = getServiceRegistry();

  const target = assertTargetConfigured(serviceName, registry[serviceName]);

  const client = createServiceHttpClient(target);
  attachResilience(client, serviceName);

  if (process.env.SERVICE_CLIENT_DEBUG === 'true') {
    console.info('SERVICE_TARGET', { serviceName, target });
  }

  serviceClients.set(serviceName, client);

  return client;
}

module.exports = {
  assertTargetConfigured,
  createServiceHttpClient,
  getServiceAgent,
  getServiceClient,
};
