// Purpose: Handle resume file upload validation and in-memory storage.
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]);

const allowedExtensions = new Set(['.pdf', '.docx', '.txt']);

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const validMime = allowedMimeTypes.has(file.mimetype);
    const validExt = allowedExtensions.has(ext);

    if (validMime || validExt) {
      return cb(null, true);
    }

    const error = new Error('Unsupported file type. Upload PDF, DOCX, or TXT only.');
    error.status = 400;
    return cb(error);
  },
});

module.exports = upload;
