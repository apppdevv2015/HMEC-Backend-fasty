const fastifyHttpProxy = require("@fastify/http-proxy");

const VERSION = "/api/v1";

const SERVICES = {
  intelligence: process.env.INTELLIGENCE_SERVICE_URL,
  auth: process.env.AUTH_SERVICE_URL,
  fleet: process.env.FLEET_SERVICE_URL,
  ingestion: process.env.INGESTION_SERVICE_URL,
  notifications: process.env.NOTIFICATION_SERVICE_URL,
  quotation: process.env.QUOTATION_SERVICE_URL || "http://localhost:3006",
};

const cleanUrl = (url) => (url ? String(url).trim().replace(/\/+$/, "") : "");

async function registerProxy(fastify, { service, prefix, rewritePrefix }) {
  const upstream = cleanUrl(SERVICES[service]);

  if (!upstream) {
    console.warn(
      `[GATEWAY][PROXY] SKIPPED ${prefix} -> ${service}: env URL set nahi hai`
    );
    return;
  }

  await fastify.register(fastifyHttpProxy, {
    upstream,
    prefix,
    rewritePrefix,
    replyOptions: {
      onError: (reply, info) => {
        const err = (info && info.error) || info || {};
        const detail = String(err.message || "unknown");
        console.error(
          `[GATEWAY][PROXY-ERROR] ${reply.request.method} ${reply.request.url} -> ${service} (${upstream}) | code=${err.code || "NONE"} | message=${detail}`
        );
        reply.code(502).send({
          success: false,
          message: `${service} service unreachable`,
          code: err.code || "UPSTREAM_ERROR",
          detail,
        });
      },
    },
  });

  console.log(`[GATEWAY][PROXY] ${prefix} -> ${service} (${upstream}) rewrite="${rewritePrefix}"`);
}

const setupProxy = async (fastify) => {
  const routes = [];


  routes.push({ service: "auth", prefix: "/api/auth", rewritePrefix: "" });

 
  for (const name of Object.keys(SERVICES)) {
    if (name === "notifications") continue;
    routes.push({ service: name, prefix: `${VERSION}/${name}`, rewritePrefix: "" });
  }

  routes.push(
    { service: "auth", prefix: `${VERSION}/notifications`, rewritePrefix: "/notifications" },
    { service: "auth", prefix: `${VERSION}/plans`, rewritePrefix: "/plans" },
    { service: "intelligence", prefix: `${VERSION}/machines`, rewritePrefix: "/machines" },
    { service: "intelligence", prefix: `${VERSION}/equipment-types`, rewritePrefix: "/machines/equipment-types" },
    { service: "intelligence", prefix: `${VERSION}/components`, rewritePrefix: "/components" },
    { service: "intelligence", prefix: `${VERSION}/maintenance`, rewritePrefix: "/maintenance" },
    { service: "intelligence", prefix: `${VERSION}/alerts`, rewritePrefix: "/alerts" },
    { service: "auth", prefix: `${VERSION}/tickets`, rewritePrefix: "/tickets" },
    { service: "intelligence", prefix: `${VERSION}/job-cards`, rewritePrefix: "/job-cards" },
    { service: "intelligence", prefix: `${VERSION}/manual-inspections`, rewritePrefix: "/machines" },
    { service: "quotation", prefix: `${VERSION}/optional-services`, rewritePrefix: "/optional-services" },
    { service: "quotation", prefix: `${VERSION}/quotations`, rewritePrefix: "/quotations" },
    { service: "quotation", prefix: `${VERSION}/quotation-plans`, rewritePrefix: "/quotation-plans" },
    { service: "quotation", prefix: "/uploads", rewritePrefix: "/uploads" }
  );

  for (const route of routes) {
    await registerProxy(fastify, route);
  }
};

module.exports = setupProxy;