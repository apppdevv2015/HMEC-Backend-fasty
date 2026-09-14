const responseHandler = require('../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

const normalizeRole = (role) => String(role || '').toLowerCase().trim().replace(/[\s_-]+/g, '');

const rbacMiddleware = (allowedRoles = []) => {
    return async (req, res) => {
        if (!req.user || !req.user.role) {
            return responseHandler(res, HTTP_STATUS.UNAUTHORIZED, false, 'Authentication required');
        }

        const userRole = normalizeRole(req.user.role);
        const normalizedAllowed = allowedRoles.map(normalizeRole);

        if (!normalizedAllowed.includes(userRole) && userRole !== 'superadmin') {
            return responseHandler(res, HTTP_STATUS.FORBIDDEN, false, `Access denied for role: ${req.user.role}`);
        }
    };
};

module.exports = {
    rbacMiddleware,
    requireSuperAdmin: rbacMiddleware(['super_admin', 'superadmin']),
    requireCompanyAdmin: rbacMiddleware(['company_admin', 'companyadmin', 'super_admin', 'superadmin', 'admin'])
};