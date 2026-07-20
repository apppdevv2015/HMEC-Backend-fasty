const buildApp = require('./app');
const PORT = process.env.PORT || 3002;

const start = async () => {
    const app = buildApp({ logger: true });
    try {
        await app.listen({ port: parseInt(PORT, 10), host: '0.0.0.0' });
        console.log(`[START] HME auth-service running on port ${PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

// Trigger restart - swagger updated v8
start();

