const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to protect routes - checks if user is logged in and token is valid
 */
const protect = async (req, res, next) => {
  let token;

  // Check if authorization header exists and follows standard Bearer schema
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Split the header to extract the token
      token = req.headers.authorization.split(' ')[1];

      // Verify token authenticity using the server secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Retrieve user information (excluding password hash)
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          status: 'fail',
          message: 'The user belonging to this token no longer exists.'
        });
      }

      // Attach user details to request context for subsequent middlewares/routes
      req.user = user;
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'fail',
          message: 'Your login session has expired. Please log in again.'
        });
      }
      return res.status(401).json({
        status: 'fail',
        message: 'Not authorized. Invalid token.'
      });
    }
  }

  // Token was not found in the authorization header
  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Not authorized. No access token provided.'
    });
  }
};

/**
 * Middleware to restrict access based on user roles
 * @param {...string} roles - Array of allowed user roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Confirm request user is loaded and matches allowed roles list
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'Access denied. You do not have permissions to perform this action.'
      });
    }
    return next();
  };
};

module.exports = { protect, authorize };
