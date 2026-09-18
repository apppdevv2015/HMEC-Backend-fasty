const fastifyHttpProxy = require("@fastify/http-proxy");

const SERVICES = {
  intelligence: process.env.INTELLIGENCE_SERVICE_URL,
  auth: process.env.AUTH_SERVICE_URL,
  fleet: process.env.FLEET_SERVICE_URL,
  ingestion: process.env.INGESTION_SERVICE_URL,
  notifications: process.env.NOTIFICATION_SERVICE_URL,
  quotation: process.env.QUOTATION_SERVICE_URL || "http://localhost:3006",
};

const setupProxy = async (fastify) => {
  const VERSION = "/api/v1";

  await fastify.register(fastifyHttpProxy, {
    upstream: SERVICES.auth,
    prefix: "/api/auth",
    rewritePrefix: "",
  });

   for (const [name, url] of Object.entries(SERVICES)) {
    if (name === "notifications") continue;
    if (!url) continue; 

    await fastify.register(fastifyHttpProxy, {
      upstream: url,
      prefix: `${VERSION}/${name}`,
      rewritePrefix: "",
    });
  }

  await fastify.register(fastifyHttpProxy, {
    upstream: SERVICES.auth,
    prefix: `${VERSION}/notifications`,
    rewritePrefix: "/notifications",
  });

  await fastify.register(fastifyHttpProxy, {
    upstream: SERVICES.auth,
    prefix: `${VERSION}/plans`,
    rewritePrefix: "/plans",
  });

  
  await fastify.register(fastifyHttpProxy, {
    upstream: SERVICES.intelligence,
    prefix: `${VERSION}/machines`,
    rewritePrefix: "/machines",
  });

 
  await fastify.register(fastifyHttpProxy, {
    upstream: SERVICES.intelligence,
    prefix: `${VERSION}/equipment-types`,
    rewritePrefix: "/machines/equipment-types",
  });

  await fastify.register(fastifyHttpProxy, {
    upstream: SERVICES.intelligence,
    prefix: `${VERSION}/components`,
    rewritePrefix: "/components",
  });

  await fastify.register(fastifyHttpProxy, {
    upstream: SERVICES.intelligence,
    prefix: `${VERSION}/maintenance`,
    rewritePrefix: "/maintenance",
  });

  await fastify.register(fastifyHttpProxy, {
    upstream: SERVICES.intelligence,
    prefix: `${VERSION}/alerts`,
    rewritePrefix: "/alerts",
  });

  await fastify.register(fastifyHttpProxy, {
    upstream: SERVICES.auth,
    prefix: `${VERSION}/tickets`,
    rewritePrefix: "/tickets",
  });

  await fastify.register(fastifyHttpProxy, {
    upstream: SERVICES.intelligence,
    prefix: `${VERSION}/job-cards`,
    rewritePrefix: "/job-cards",
  });

 
  await fastify.register(fastifyHttpProxy, {
    upstream: SERVICES.intelligence,
    prefix: `${VERSION}/manual-inspections`,
    rewritePrefix: "/machines",
  });

  await fastify.register(fastifyHttpProxy, {
    upstream: SERVICES.quotation,
    prefix: `${VERSION}/optional-services`,
    rewritePrefix: "/optional-services",
  });

  await fastify.register(fastifyHttpProxy, {
    upstream: SERVICES.quotation,
    prefix: `${VERSION}/quotations`,
    rewritePrefix: "/quotations",
  });

  await fastify.register(fastifyHttpProxy, {
    upstream: SERVICES.quotation,
    prefix: `${VERSION}/quotation-plans`,
    rewritePrefix: "/quotation-plans",
  });

  await fastify.register(fastifyHttpProxy, {
    upstream: SERVICES.quotation,
    prefix: "/uploads",
    rewritePrefix: "/uploads",
  });
};

module.exports = setupProxy;