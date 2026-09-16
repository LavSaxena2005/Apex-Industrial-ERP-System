/**
 * Role-Based Access Control (RBAC) middleware
 * Checks if authenticated user has one of the allowed roles.
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No active session.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Action requires role(s): ${allowedRoles.join(', ')}. Your role is '${req.user.role}'.`,
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
