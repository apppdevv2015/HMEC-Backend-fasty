const setupWebsocket = async (fastify) => {
    // Register WebSocket route
    fastify.get('/ws/alerts', { websocket: true }, async (connection, req) => {
        try {
            const { redis } = fastify;
            
            if (!redis) {
                console.error('[WS-ERROR] Redis client is not initialized on fastify!');
                connection.socket.send(JSON.stringify({ 
                    type: 'ERROR', 
                    message: 'Internal error: Redis client not initialized.' 
                }));
                connection.socket.close();
                return;
            }

            // 1. Extract User Info (support JWT token or development debug params)
            let userId = req.query.userId || 'guest';
            let role = req.query.role || 'User';
            
            // JWT Authentication (Optional check if token is provided)
            const token = req.query.token;
            if (token) {
                try {
                    const jwt = require('jsonwebtoken');
                    const JWT_SECRET = process.env.JWT_SECRET;
                    const decoded = jwt.verify(token, JWT_SECRET);
                    userId = decoded.id || decoded.userId;
                    role = decoded.role || decoded.roleName || 'User';
                } catch (err) {
                    console.error('[WS] Token verification failed:', err.message);
                    connection.socket.send(JSON.stringify({ 
                        type: 'ERROR', 
                        message: 'Authentication failed. Invalid Token.' 
                    }));
                    connection.socket.close();
                    return;
                }
            }
            
            console.log(`[WS-ALERT-GATEWAY] Client connected. User: ${userId}, Role: ${role}`);
            
            // Send initial connection success message
            connection.socket.send(JSON.stringify({ 
                type: 'CONNECTED', 
                message: `Successfully connected. Listening for real-time alerts.`,
                user: { userId, role }
            }));
            
            // 2. Setup Redis Subscriptions for real-time channels
            const redisSubscriber = redis.duplicate();
            
            // ioredis connects automatically. Calling .connect() when it is already connecting/connected throws an error.
            if (redisSubscriber.status === 'wait') {
                try {
                    await redisSubscriber.connect();
                } catch (err) {
                    console.error('[WS-REDIS] Failed to connect duplicate Redis client:', err);
                    connection.socket.send(JSON.stringify({ 
                        type: 'ERROR', 
                        message: 'Internal real-time database connection error.' 
                    }));
                    connection.socket.close();
                    return;
                }
            }

            redisSubscriber.on('error', (err) => {
                console.error('[WS-REDIS-SUBSCRIBER] Redis subscriber error:', err);
            });

            // Define subscription channels
            const userChannel = `user:${userId}:alerts`;
            const roleChannel = `role:${role}:alerts`;
            const globalChannel = `alerts:global`;

            // 3. Subscribe to all channels
            try {
                // ioredis uses the 'message' event to receive Pub/Sub messages
                redisSubscriber.on('message', (channel, message) => {
                    try {
                        connection.socket.send(JSON.stringify({
                            type: 'ALERT',
                            channel,
                            data: JSON.parse(message),
                            timestamp: new Date()
                        }));
                        console.log(`[WS-ALERT-PUSH] Sent alert from ${channel} to User: ${userId}`);
                    } catch (parseErr) {
                        console.error('[WS-PARSE-ERROR] Failed to parse alert message:', parseErr);
                    }
                });

                await redisSubscriber.subscribe(userChannel, roleChannel, globalChannel);
            } catch (err) {
                console.error('[WS-SUBSCRIBE] Subscription failed:', err);
            }

            // 4. Handle client disconnect and cleanup
            connection.socket.on('close', async () => {
                console.log(`[WS-ALERT-GATEWAY] Client disconnected. User: ${userId}`);
                try {
                    await redisSubscriber.unsubscribe([userChannel, roleChannel, globalChannel]);
                    await redisSubscriber.disconnect();
                } catch (err) {
                    console.error('[WS-CLEANUP] Failed to cleanup subscriptions:', err);
                }
            });
            
            // Simple heartbeat ping/pong to keep connection alive
            connection.socket.on('message', (message) => {
                const msg = message.toString();
                if (msg === 'ping') {
                    connection.socket.send('pong');
                }
            });
        } catch (globalErr) {
            console.error('[WS-GLOBAL-ERROR] Uncaught exception in WS handler:', globalErr);
            try {
                connection.socket.close();
            } catch (e) {}
        }
    });
};

module.exports = setupWebsocket;
