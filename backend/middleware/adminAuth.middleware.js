const jwt = require('jsonwebtoken');

function getTokenFromHeader(value) {
  const authHeader = String(value || '').trim();
  if (!authHeader.toLowerCase().startsWith('bearer ')) return '';
  return authHeader.slice(7).trim();
}

function requireAdminAuth(req, res, next) {
  try {
    const token = getTokenFromHeader(req.headers.authorization);
    if (!token) {
      const error = new Error('Missing admin token.');
      error.status = 401;
      throw error;
    }

    const jwtSecret = String(process.env.JWT_SECRET || '').trim();
    if (!jwtSecret) {
      const error = new Error('JWT secret is missing.');
      error.status = 500;
      throw error;
    }

    const decoded = jwt.verify(token, jwtSecret);
    if (!decoded || decoded.role !== 'admin') {
      const error = new Error('Admin access denied.');
      error.status = 401;
      throw error;
    }

    req.admin = {
      email: decoded.email || '',
      role: decoded.role,
    };
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      error.status = 401;
      error.message = 'Invalid or expired admin token.';
    }
    return next(error);
  }
}

module.exports = {
  requireAdminAuth,
};
