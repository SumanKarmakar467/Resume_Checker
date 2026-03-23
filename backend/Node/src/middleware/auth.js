const jwt = require('jsonwebtoken');

const DEFAULT_JWT_SECRET = 'resume_checker_dev_secret_change_me';

function getJwtSecret() {
  return process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
}

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return '';
  return authHeader.slice('Bearer '.length).trim();
}

function parseUserFromToken(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getJwtSecret());
    return {
      id: payload.sub || payload.id || '',
      email: payload.email || ''
    };
  } catch (error) {
    return null;
  }
}

function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  const user = parseUserFromToken(token);

  if (!user?.id) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  req.user = user;
  return next();
}

function optionalAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  req.user = parseUserFromToken(token);
  return next();
}

module.exports = {
  requireAuth,
  optionalAuth,
  getJwtSecret
};
