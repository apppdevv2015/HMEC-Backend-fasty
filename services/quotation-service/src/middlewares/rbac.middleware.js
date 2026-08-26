const responseHandler = require('../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

const rbacMiddleware = (allowedRoles = []) => {
    return async (req, res) => {
        if (!req.user || !req.user.role) {
            return responseHandler(res, HTTP_STATUS.UNAUTHORIZED, false, 'Authentication required');
        }

        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
            return responseHandler(res, HTTP_STATUS.FORBIDDEN, false, `Access denied for role: ${userRole}`);
        }
    };
};

module.exports = {
    rbacMiddleware,
    requireSuperAdmin: rbacMiddleware(['super_admin']),
    requireCompanyAdmin: rbacMiddleware(['company_admin', 'super_admin'])
};
