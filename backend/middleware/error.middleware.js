// Purpose: Centralized HTTP error handlers for predictable API responses.
function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err && err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Max size is 10MB.' });
    }
    return res.status(400).json({ error: err.message || 'Upload error.' });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal server error.';

  if (status >= 500) {
    console.error('[server] unhandled error:', err);
  }

  return res.status(status).json({ error: message });
}

module.exports = {
  notFound,
  errorHandler,
};
