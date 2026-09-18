const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = async (request, reply) => {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    reply.status(401).send({ error: "No token provided" });
    return;
  }

  let token = authHeader.split(" ")[1];
  if (!token) {
    reply.status(401).send({ error: "Invalid token format" });
    return;
  }
  token = token.trim().replace(/^"+|"+$/g, "");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    request.user = {
      ...decoded,
      id: decoded.id || decoded.userId || decoded.sub || null,
    };
  } catch (err) {
    reply.status(401).send({ error: "Invalid or expired token" });
    return;
  }
};

module.exports = authMiddleware;