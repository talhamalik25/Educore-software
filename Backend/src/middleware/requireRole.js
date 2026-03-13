const { sendError } = require('../utils/apiResponse');

// Usage: requireRole('admin', 'superadmin')
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return sendError(
                res,
                403,
                `Access denied. Required role: ${roles.join(' or ')}`
            );
        }
        next();
    };
};

module.exports = requireRole;
