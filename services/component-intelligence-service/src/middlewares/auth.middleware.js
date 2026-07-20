const jwt = require('jsonwebtoken');
const responseHandler = require('../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

const authMiddleware = async (request, reply) => {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            responseHandler(reply, HTTP_STATUS.UNAUTHORIZED, false, 'Authorization token is required');
            return;
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hme-secret-key-2026');
        
        request.user = decoded;
    } catch (error) {
        responseHandler(reply, HTTP_STATUS.UNAUTHORIZED, false, 'Invalid or expired token');
        return;
    }
};

const isAdmin = async (request, reply) => {
    if (request.user && (request.user.role === 'admin' || request.user.role === 'company_admin' || request.user.role === 'super_admin' || request.user.role === 'sub_super_admin')) {
        // Validation passes
    } else {
        responseHandler(reply, HTTP_STATUS.FORBIDDEN, false, 'Access denied. Admin rights required.');
        return;
    }
};

module.exports = { authMiddleware, isAdmin };
