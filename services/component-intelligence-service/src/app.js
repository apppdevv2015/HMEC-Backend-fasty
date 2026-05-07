const express = require('express');
const { createLogger } = require('../../../packages/shared');
const intelligenceRoutes = require('./modules/intelligence/routes/intelligence.routes');

const logger = createLogger('intelligence-service');
const app = express();
app.use(express.json());

// --- Routes ---

// Health Check
app.get('/health', (req, res) => res.json({ status: 'UP', service: 'intelligence-service' }));

// Intelligence Module
app.use('/', intelligenceRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error(`Unhandled Error: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
