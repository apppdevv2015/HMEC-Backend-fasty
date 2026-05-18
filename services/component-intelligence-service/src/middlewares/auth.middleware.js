const jwt = require('jsonwebtoken');
const responseHandler = require('../utils/responseHandler');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return responseHandler(res, 401, false, 'Authorization token is required');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hme-secret-key-2026');
        
        req.user = decoded;
        next();
    } catch (error) {
        return responseHandler(res, 401, false, 'Invalid or expired token');
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'company_admin' || req.user.role === 'super_admin')) {
        next();
    } else {
        return responseHandler(res, 403, false, 'Access denied. Admin rights required.');
    }
};

module.exports = { authMiddleware, isAdmin };
