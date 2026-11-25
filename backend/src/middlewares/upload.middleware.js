
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

// Upload directory
const uploadDir = path.resolve(__dirname, '../../uploads');

// Create uploads folder if it does not exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// File storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${crypto.randomUUID()}${extension}`;
    cb(null, uniqueName);
  },
});

// Allowed file types
const allowedTypes = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
};

// Validate uploaded file
const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const validExtensions = allowedTypes[file.mimetype];

  if (validExtensions && validExtensions.includes(extension)) {
    return cb(null, true);
  }

  cb(new ApiError(400, 'Only JPG, JPEG, PNG, or PDF files are allowed'));
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // Maximum 2 MB
    files: 1,
  },
});

module.exports = upload;
