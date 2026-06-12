const { createClient } = require('redis');

async function publishAlert() {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    const client = createClient({ 
        url: redisUrl,
        RESP: 2 
    });

    client.on('error', (err) => console.error('[Redis Error]', err));

    try {
        console.log(`Connecting to Redis at ${redisUrl}...`);
        await client.connect();
        console.log('Connected to Redis successfully.');

        // Test alert payload
        const alertPayload = {
            id: 'alert-' + Date.now(),
            severity: 'CRITICAL',
            component: 'Engine Oil Pump',
            message: 'High temperature anomaly detected in Fleet Component #402',
            timestamp: new Date().toISOString()
        };

        // We will publish to three channels to demonstrate all types of alerts
        
        // 1. Global Alert (sent to everyone)
        console.log('\n--- Publishing Global Alert ---');
        await client.publish('alerts:global', JSON.stringify({
            ...alertPayload,
            message: '[GLOBAL ALERT] Scheduled maintenance window starting in 15 minutes.'
        }));
        console.log('Published to channel: alerts:global');

        // 2. Role Alert (sent to Admins)
        console.log('\n--- Publishing Role-Specific Alert ---');
        await client.publish('role:Admin:alerts', JSON.stringify({
            ...alertPayload,
            message: '👥 [STAFF ALERT] New Staff Member (Rahul Sharma) has been successfully added to your company workspace.'
        }));
        console.log('Published to channel: role:Admin:alerts');

        // 3. User Alert (sent specifically to user debug-user-99)
        console.log('\n--- Publishing User-Specific Alert ---');
        await client.publish('user:debug-user-99:alerts', JSON.stringify({
            ...alertPayload,
            message: '[USER ALERT] Your component intelligence report is ready for download.'
        }));
        console.log('Published to channel: user:debug-user-99:alerts');

        console.log('\nSuccessfully published test alerts! Check your WebSocket client console.');

    } catch (error) {
        console.error('Failed to publish alert:', error);
    } finally {
        await client.disconnect();
    }
}

publishAlert();
