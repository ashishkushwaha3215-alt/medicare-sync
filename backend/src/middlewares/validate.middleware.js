
const { validationResult } = require('express-validator');
const fs = require('fs/promises');

module.exports = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array();

  // Remove uploaded file if validation fails
  if (req.file?.path) {
    fs.unlink(req.file.path).catch((error) => {
      console.error('Uploaded file cleanup failed:', error.message);
    });
  }

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.map((error) => ({
      field: error.path,
      msg: error.msg,
    })),
  });
};
