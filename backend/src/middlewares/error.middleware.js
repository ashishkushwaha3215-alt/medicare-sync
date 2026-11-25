
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors)
      .map((error) => error.message)
      .join(', ');
  }

  // Duplicate MongoDB entry
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already exists` : 'Duplicate entry';
  }

  // Invalid MongoDB ID
  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
  }

  // JWT errors
  if (
    err.name === 'JsonWebTokenError' ||
    err.name === 'TokenExpiredError'
  ) {
    status = 401;
    message = 'Invalid or expired token';
  }

  res.status(status).json({
    success: false,
    message,
    errors: err.errors || [],
    ...(process.env.NODE_ENV !== 'production' && {
      stack: err.stack,
    }),
  });
};

module.exports = {
  notFound,
  errorHandler,
};
