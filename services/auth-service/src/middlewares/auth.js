const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'hme-secret-key-2026';

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Authentication Required: Please login to get access.' 
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ 
            success: false,
            message: 'Invalid or Expired Token: Please login again.' 
        });
    }
};

const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false,
                message: 'Access Denied: Insufficient Permissions' 
            });
        }
        next();
    };
};

module.exports = {
    authMiddleware,
    roleMiddleware
};
