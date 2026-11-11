require('dotenv').config({
    path: require('path').resolve(__dirname, '../../../.env')
});
const buildApp = require('./app');
const PORT = process.env.API_GATEWAY_PORT;
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

// reload 1787829709065