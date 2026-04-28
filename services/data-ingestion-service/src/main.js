const app = require('./app');
const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log('HME data-ingestion-service running on ' + PORT));
