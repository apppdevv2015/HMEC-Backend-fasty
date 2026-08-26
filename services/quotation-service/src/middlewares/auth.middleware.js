const jwt = require('jsonwebtoken');
const responseHandler = require('../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return responseHandler(res, HTTP_STATUS.UNAUTHORIZED, false, 'Authorization token missing or malformed');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = {
            id: decoded.id || decoded.userId,
            email: decoded.email,
            role: String(decoded.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_'),
            companyId: decoded.companyId,
            name: decoded.name || `${decoded.firstName || ''} ${decoded.lastName || ''}`.trim()
        };

        return;
    } catch (error) {
        return responseHandler(res, HTTP_STATUS.UNAUTHORIZED, false, 'Invalid or expired token');
    }
};

const optionalAuthMiddleware = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = {
                id: decoded.id || decoded.userId,
                email: decoded.email,
                role: String(decoded.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_'),
                companyId: decoded.companyId,
                name: decoded.name
            };
        }
    } catch (e) {
        // Continue unauthenticated
    }
};

module.exports = {
    authMiddleware,
    optionalAuthMiddleware
};
