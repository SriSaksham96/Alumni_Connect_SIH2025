const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (!user.isUserActive()) {
      return res.status(401).json({ message: 'Account deactivated' });
    }

    // Update last active timestamp
    user.updateLastActive();

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Check if user has specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({ 
        message: `Permission '${permission}' required`,
        requiredPermission: permission,
        userRole: req.user.role
      });
    }
    next();
  };
};

// Check if user has any of the specified roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user.hasAnyRole(roles)) {
      return res.status(403).json({ 
        message: `Access restricted to: ${roles.join(', ')}`,
        requiredRoles: roles,
        userRole: req.user.role
      });
    }
    next();
  };
};

// Check if user is admin or super admin
const requireAdmin = (req, res, next) => {
  if (!req.user.hasAnyRole(['admin', 'super_admin'])) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Check if user is super admin
const requireSuperAdmin = (req, res, next) => {
  if (!req.user.hasRole('super_admin')) {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
};

// Check if user is alumni, admin, or super admin
const requireAlumni = (req, res, next) => {
  if (!req.user.hasAnyRole(['alumni', 'admin', 'super_admin'])) {
    return res.status(403).json({ message: 'Alumni access required' });
  }
  next();
};

// Check if user is verified
const requireVerified = (req, res, next) => {
  if (!req.user.isVerified()) {
    return res.status(403).json({ message: 'Account verification required' });
  }
  next();
};

// Check if user can access admin panel
const requireAdminPanel = (req, res, next) => {
  if (!req.user.canAccessAdminPanel()) {
    return res.status(403).json({ message: 'Admin panel access required' });
  }
  next();
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isUserActive()) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Check if user owns resource or is admin
const requireOwnershipOrAdmin = (resourceUserIdField = 'user') => {
  return (req, res, next) => {
    const resourceUserId = req.resource ? req.resource[resourceUserIdField] : req.params.userId;
    
    if (req.user.hasAnyRole(['admin', 'super_admin']) || req.user._id.toString() === resourceUserId.toString()) {
      return next();
    }
    
    return res.status(403).json({ message: 'Access denied' });
  };
};

// Rate limiting for specific routes
const createRateLimit = (windowMs, max, message) => {
  const rateLimit = require('express-rate-limit');
  return rateLimit({
    windowMs,
    max,
    message: { message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireRole,
  requireAdmin,
  requireSuperAdmin,
  requireAlumni,
  requireVerified,
  requireAdminPanel,
  optionalAuth,
  requireOwnershipOrAdmin,
  createRateLimit
};
