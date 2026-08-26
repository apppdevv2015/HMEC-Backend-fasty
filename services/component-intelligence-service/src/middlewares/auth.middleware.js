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
    const role = String(request.user?.role || '').toLowerCase();
    if (request.user && (role.includes('admin') || role.includes('supervisor') || role.includes('manager'))) {
        // Validation passes
    } else {
        responseHandler(reply, HTTP_STATUS.FORBIDDEN, false, 'Access denied. Admin or Supervisor rights required.');
        return;
    }
};

const canAssignMachine = async (request, reply) => {
    const role = String(request.user?.role || '').toLowerCase();
    if (role.includes('operator') || role.includes('artisan')) {
        responseHandler(reply, HTTP_STATUS.FORBIDDEN, false, 'Access denied. Operators and Artisans cannot assign machines. Only Supervisors, Admins, or Managers are authorized.');
        return;
    }
};

module.exports = { authMiddleware, isAdmin, canAssignMachine };
