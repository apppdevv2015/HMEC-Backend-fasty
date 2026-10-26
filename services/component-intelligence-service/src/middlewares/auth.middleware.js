const jwt = require('jsonwebtoken');
const responseHandler = require('../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}

const authMiddleware = async (request, reply) => {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            responseHandler(reply, HTTP_STATUS.UNAUTHORIZED, false, 'Authorization token is required');
            return;
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
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
    const allowed = role.includes('admin') || role.includes('supervisor') || role.includes('manager');
    if (!allowed) {
        responseHandler(reply, HTTP_STATUS.FORBIDDEN, false, 'Access denied. Only Supervisors, Admins, or Managers are authorized to assign machines.');
        return;
    }
};

const SUPER_ROLES = ['super_admin', 'sub_super_admin'];

const isSuperAdmin = (request) =>
    SUPER_ROLES.includes(String(request.user?.role || '').toLowerCase());


const getCompanyScope = (request) => {
    if (isSuperAdmin(request)) {
        return request.query?.companyId || request.user?.companyId || null;
    }
    return request.user?.companyId || null;
};


const getTenantFilter = (request) =>
    isSuperAdmin(request) ? null : (request.user?.companyId || '__none__');

const requireRoles = (keywords) => async (request, reply) => {
    const role = String(request.user?.role || '').toLowerCase();
    if (!keywords.some((k) => role.includes(k))) {
        responseHandler(reply, HTTP_STATUS.FORBIDDEN, false, 'Access denied. You do not have permission for this action.');
        return;
    }
};

module.exports = {
    authMiddleware, isAdmin, canAssignMachine,
    isSuperAdmin, getCompanyScope, getTenantFilter, requireRoles
};
