const jwt = require('jsonwebtoken');

/**
 * Middleware: Validates the JSON Web Token (JWT) on protected routes.
 * Security reasoning: Intercepts expired tokens cleanly and ensures that
 * all secured operations are backed by a cryptographically verified signature.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Session expired. Please log in again.' });
      }
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = user;
    next();
  });
};

/**
 * Middleware: Enforces Role-Based Access Control (RBAC).
 * Security reasoning: Prevents horizontal and vertical privilege escalation 
 * by checking the verified JWT role against the route's required permissions.
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
