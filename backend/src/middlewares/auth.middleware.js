const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// 1. Check karega ki user logged-in hai aur valid JWT token bheja hai ya nahi
exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token =
    header && header.startsWith('Bearer ') ? header.split(' ')[1] : null;

  if (!token) {
    throw new ApiError(401, 'Not authorized, token missing');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user || user.isActive === false) {
    throw new ApiError(401, 'User no longer exists or is deactivated');
  }

  req.user = user;
  next();
});

// 2. Role-Based Access Control (RBAC): sirf allowed roles ko aage jaane dega
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new ApiError(403, `Access denied: ${req.user.role} cannot perform this action`)
    );
  }
  next();
};