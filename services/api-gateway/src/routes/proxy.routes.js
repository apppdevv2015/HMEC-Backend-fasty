const { createProxyMiddleware } = require('http-proxy-middleware');

const SERVICES = {
    intelligence: process.env.INTELLIGENCE_SERVICE_URL || 'http://localhost:3001',
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
    fleet: process.env.FLEET_SERVICE_URL || 'http://localhost:3003',
    ingestion: process.env.INGESTION_SERVICE_URL || 'http://localhost:3004',
    notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005'
};

const setupProxy = (app) => {
    const VERSION = '/api/v1';

    // 1. Versioned Generic Service Proxies (e.g., /api/v1/auth -> auth-service)
    Object.entries(SERVICES).forEach(([name, url]) => {
        app.use(`${VERSION}/${name}`, createProxyMiddleware({
            target: url,
            changeOrigin: true,
            pathRewrite: { [`^${VERSION}/${name}`]: '' },
            onProxyRes: (proxyRes, req) => {
                console.log(`[GATEWAY-V1] ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
            }
        }));
    });

    // 2. Specialized Unified Routes for V1
    
    // Plans -> Auth Service
    app.use(`${VERSION}/plans`, createProxyMiddleware({
        target: SERVICES.auth,
        changeOrigin: true,
        pathRewrite: { [`^${VERSION}/plans`]: '/plans' }
    }));

    // Machines -> Intelligence Service
    app.use(`${VERSION}/machines`, createProxyMiddleware({
        target: SERVICES.intelligence,
        changeOrigin: true,
        pathRewrite: { [`^${VERSION}/machines`]: '/machines' }
    }));

    // Support legacy /api/auth paths
    app.use('/api/auth', createProxyMiddleware({
        target: SERVICES.auth,
        changeOrigin: true,
        pathRewrite: { '^/api/auth': '' }
    }));

    // New API v1 Auth Route
    app.use(`${VERSION}/auth`, createProxyMiddleware({
        target: SERVICES.auth,
        changeOrigin: true,
        pathRewrite: { [`^${VERSION}/auth`]: '' }
    }));
};

module.exports = setupProxy;
