require('dotenv').config();
const buildApp = require('./app');
const PORT = process.env.PORT;
const HOST = '0.0.0.0';

const app = buildApp();

const start = async () => {
    try {
        await app.listen({ port: PORT, host: HOST });
        console.log(`HME api-gateway running on http://${HOST}:${PORT}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

// Trigger restart to reload JWT_SECRET and Swagger configurations
start();
// trigger gateway reload v11
