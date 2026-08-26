const fastifyHttpProxy = require('@fastify/http-proxy');

const SERVICES = {
    intelligence: process.env.INTELLIGENCE_SERVICE_URL,
    auth: process.env.AUTH_SERVICE_URL,
    fleet: process.env.FLEET_SERVICE_URL,
    ingestion: process.env.INGESTION_SERVICE_URL,
    notifications: process.env.NOTIFICATION_SERVICE_URL,
    quotation: process.env.QUOTATION_SERVICE_URL || 'http://localhost:3006'
};

const setupProxy = async (fastify) => {
    const VERSION = '/api/v1';

    // 1. Support legacy /api/auth paths -> auth-service
    await fastify.register(fastifyHttpProxy, {
        upstream: SERVICES.auth,
        prefix: '/api/auth',
        rewritePrefix: ''
    });

    // 2. Versioned Generic Service Proxies (e.g. /api/v1/auth, /api/v1/intelligence, /api/v1/quotation)
    for (const [name, url] of Object.entries(SERVICES)) {
        await fastify.register(fastifyHttpProxy, {
            upstream: url,
            prefix: `${VERSION}/${name}`,
            rewritePrefix: ''
        });
    }

    // 3. Specialized Unified Routes for V1
    
    // Plans -> Auth Service
    await fastify.register(fastifyHttpProxy, {
        upstream: SERVICES.auth,
        prefix: `${VERSION}/plans`,
        rewritePrefix: '/plans'
    });

    // Machines -> Intelligence Service
    await fastify.register(fastifyHttpProxy, {
        upstream: SERVICES.intelligence,
        prefix: `${VERSION}/machines`,
        rewritePrefix: '/machines'
    });

    // Components -> Intelligence Service
    await fastify.register(fastifyHttpProxy, {
        upstream: SERVICES.intelligence,
        prefix: `${VERSION}/components`,
        rewritePrefix: '/components'
    });

    // Maintenance -> Intelligence Service
    await fastify.register(fastifyHttpProxy, {
        upstream: SERVICES.intelligence,
        prefix: `${VERSION}/maintenance`,
        rewritePrefix: '/maintenance'
    });

    // Tickets -> Auth Service
    await fastify.register(fastifyHttpProxy, {
        upstream: SERVICES.auth,
        prefix: `${VERSION}/tickets`,
        rewritePrefix: '/tickets'
    });

    // Job Cards -> Intelligence Service
    await fastify.register(fastifyHttpProxy, {
        upstream: SERVICES.intelligence,
        prefix: `${VERSION}/job-cards`,
        rewritePrefix: '/job-cards'
    });

    // Manual Inspections -> Intelligence Service (maps to machines/manual-data)
    await fastify.register(fastifyHttpProxy, {
        upstream: SERVICES.intelligence,
        prefix: `${VERSION}/manual-inspections`,
        rewritePrefix: '/machines'
    });

    // Optional Services -> Quotation Service
    await fastify.register(fastifyHttpProxy, {
        upstream: SERVICES.quotation,
        prefix: `${VERSION}/optional-services`,
        rewritePrefix: '/optional-services'
    });

    // Quotations -> Quotation Service
    await fastify.register(fastifyHttpProxy, {
        upstream: SERVICES.quotation,
        prefix: `${VERSION}/quotations`,
        rewritePrefix: '/quotations'
    });
};

module.exports = setupProxy;
