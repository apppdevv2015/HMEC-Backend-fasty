const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'hme-secret-key-2026';

const authMiddleware = async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        reply.status(401).send({ error: 'No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        request.user = decoded;
    } catch (err) {
        reply.status(401).send({ error: 'Invalid token' });
    }
};

module.exports = authMiddleware;
