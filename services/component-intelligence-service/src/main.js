require('dotenv').config();
const buildApp = require('./app');
const PORT = process.env.PORT || 3001;

const start = async () => {
    const app = buildApp({ logger: true });
    try {
        await app.listen({ port: parseInt(PORT, 10), host: '0.0.0.0' });
        console.log(`[START] HME Component Intelligence Service running on port ${PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();

