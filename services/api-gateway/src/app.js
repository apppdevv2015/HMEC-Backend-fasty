const express = require('express');
const cors = require('cors');
const setupSwagger = require('./swagger/config');
const setupProxy = require('./routes/proxy.routes');
const app = express();

app.use(cors());

// Setup Unified Swagger Docs
setupSwagger(app);

// Request Logger
app.use((req, res, next) => {
    console.log(`[GATEWAY] ${req.method} ${req.url}`);
    next();
});

// Gateway Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'hme-api-gateway' });
});

// Setup All Proxy Routes
setupProxy(app);

module.exports = app;
