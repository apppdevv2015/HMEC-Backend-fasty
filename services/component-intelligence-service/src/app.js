const express = require('express');
const cors = require('cors');
const setupSwagger = require('./config/swagger');
const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => res.json({ status: 'UP', service: 'intelligence-service' }));

// Request Logger
app.use((req, res, next) => {
    console.log(`[INTELLIGENCE-SERVICE] ${req.method} ${req.url}`);
    next();
});

// Swagger Setup
setupSwagger(app);

// Routes
const componentRoutes = require('./modules/components/routes/component.routes');
const machineRoutes = require('./modules/machines/routes/machine.routes');

app.use('/components', componentRoutes);
app.use('/machines', machineRoutes);

module.exports = app;
