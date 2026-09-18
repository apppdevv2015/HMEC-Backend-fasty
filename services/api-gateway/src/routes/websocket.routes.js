const setupWebsocket = async (fastify) => {
  fastify.get("/ws/alerts", { websocket: true }, async (connection, req) => {
    try {
      const { redis } = fastify;

      if (!redis) {
        console.error("[WS-ERROR] Redis client is not initialized on fastify!");

        connection.socket.send(
          JSON.stringify({
            type: "ERROR",
            message: "Internal error: Redis client not initialized.",
          }),
        );

        connection.socket.close();
        return;
      }

      const token = req.query.token;

      if (!token) {
        connection.socket.send(
          JSON.stringify({
            type: "ERROR",
            message: "Authentication required. No token provided.",
          }),
        );

        connection.socket.close();
        return;
      }

      let userId;
      let role;
      let companyId;
      let decoded;

      // JWT verification
      try {
        const jwt = require("jsonwebtoken");
        const JWT_SECRET = process.env.JWT_SECRET;

        if (!JWT_SECRET) {
          throw new Error("JWT_SECRET is not configured");
        }

        decoded = jwt.verify(token, JWT_SECRET);

        userId = decoded.id || decoded.userId;
        role = decoded.role || decoded.roleName || "User";
        companyId = decoded.companyId;

        if (!userId) {
          throw new Error("User ID missing from token");
        }

        console.log(
          `[WS-AUTH] Authenticated user: ${userId}, role: ${role}, company: ${companyId}`,
        );
      } catch (err) {
        console.error("[WS] Token verification failed:", err.message);

        connection.socket.send(
          JSON.stringify({
            type: "ERROR",
            message: "Authentication failed. Invalid Token.",
          }),
        );

        connection.socket.close();
        return;
      }

      console.log(
        `[WS-ALERT-GATEWAY] Client connected. User: ${userId}, Role: ${role}`,
      );

      connection.socket.send(
        JSON.stringify({
          type: "CONNECTED",
          message: "Successfully connected. Listening for real-time alerts.",
          user: {
            userId,
            role,
          },
        }),
      );

      const redisSubscriber = redis.duplicate();

      redisSubscriber.on("error", (err) => {
        console.error("[WS-REDIS-SUBSCRIBER] Redis subscriber error:", err);
      });

      const {
        normalizeRole,
        isSuperAdminRole,
        SUPER_ADMIN_CHANNEL,
      } = require("../../../../shared/notifications/notificationPublisher");

      const userChannel = `user:${userId}:alerts`;

      const roleChannel =
        companyId && role
          ? `company:${companyId}:role:${normalizeRole(role)}:alerts`
          : null;

      const superAdminChannel = isSuperAdminRole(role)
        ? SUPER_ADMIN_CHANNEL
        : null;

      const globalChannel = "alerts:global";

      const channels = [
        userChannel,
        roleChannel,
        superAdminChannel,
        globalChannel,
      ].filter(Boolean);

      redisSubscriber.on("message", (channel, message) => {
        try {
          if (connection.socket.readyState !== 1) return;
          connection.socket.send(
            JSON.stringify({
              type: "ALERT",
              channel,
              data: JSON.parse(message),
              timestamp: new Date(),
            }),
          );
          console.log(
            `[WS-ALERT-PUSH] Sent alert from ${channel} to User: ${userId}`,
          );
        } catch (parseErr) {
          console.error(
            "[WS-PARSE-ERROR] Failed to parse alert message:",
            parseErr,
          );
        }
      });

      try {
        await redisSubscriber.subscribe(...channels);
        console.log(
          `[WS-SUBSCRIBE] User ${userId} subscribed to: ${channels.join(", ")}`,
        );
      } catch (err) {
        console.error("[WS-SUBSCRIBE] Subscription failed:", err);
      }

      // Cleanup
      connection.socket.on("close", async () => {
        console.log(`[WS-ALERT-GATEWAY] Client disconnected. User: ${userId}`);

        try {
          const channels = [
            userChannel,
            roleChannel,
            superAdminChannel,
            globalChannel,
          ].filter(Boolean);

          if (channels.length > 0) {
            await redisSubscriber.unsubscribe(...channels);
          }

          await redisSubscriber.disconnect();
        } catch (err) {
          console.error("[WS-CLEANUP] Failed to cleanup subscriptions:", err);
        }
      });

      // Ping / pong
      connection.socket.on("message", (message) => {
        const msg = message.toString();

        try {
          const parsed = JSON.parse(msg);

          if (parsed.type === "ping") {
            connection.socket.send(
              JSON.stringify({
                type: "pong",
              }),
            );
          }
        } catch (err) {
          if (msg === "ping") {
            connection.socket.send("pong");
          }
        }
      });
    } catch (globalErr) {
      console.error(
        "[WS-GLOBAL-ERROR] Uncaught exception in WS handler:",
        globalErr,
      );

      try {
        connection.socket.close();
      } catch (err) {}
    }
  });
};

module.exports = setupWebsocket;
