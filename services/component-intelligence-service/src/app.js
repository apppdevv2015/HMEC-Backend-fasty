const express = require('express');
const { Pool } = require('pg');
const { createLogger } = require('../../../packages/shared');
const logger = createLogger('intelligence-service');

const app = express();
app.use(express.json());

// Database Configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Real Database Health Check
app.get('/health', async (req, res) => {
    logger.info('Health check requested');
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        res.json({ 
            status: 'UP', 
            service: 'intelligence-service',
            database: 'CONNECTED',
            db_time: result.rows[0].now
        });
    } catch (err) {
        logger.error(`Database Connection Failed: ${err.message}`);
        res.status(500).json({ 
            status: 'DOWN', 
            service: 'intelligence-service',
            database: 'DISCONNECTED',
            error: err.message
        });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error(`Unhandled Error: ${err.message} \nStack: ${err.stack}`);
    res.status(500).json({ error: 'Internal Server Error', reference: 'Check logs/error.log' });
});

module.exports = app;
