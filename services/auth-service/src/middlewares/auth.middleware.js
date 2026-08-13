const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        reply.status(401).send({ error: 'No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        reply.status(401).send({ error: 'Invalid token format' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        request.user = decoded;
    } catch (err) {
        reply.status(401).send({ error: 'Invalid or expired token' });
        return;
    }
};

module.exports = authMiddleware;
