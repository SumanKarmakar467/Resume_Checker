const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../middleware/auth');
const { createUser, findUserByEmail } = require('../services/memoryStore');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isDbReady() {
  return User?.db?.readyState === 1;
}

function sanitizeEmail(value) {
  return String(value || '').toLowerCase().trim();
}

function serializeUser(user) {
  if (!user) return null;
  return {
    id: String(user._id || user.id || ''),
    email: user.email || ''
  };
}

function createToken(user) {
  const expiresInDays = Number(process.env.JWT_EXPIRY_DAYS || 7);
  return jwt.sign(
    { sub: user.id, email: user.email },
    getJwtSecret(),
    { expiresIn: `${expiresInDays}d` }
  );
}

async function findExistingUser(email) {
  if (isDbReady()) return User.findOne({ email }).lean();
  return findUserByEmail(email);
}

async function register(req, res) {
  try {
    const email = sanitizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existingUser = await findExistingUser(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let userRecord;

    if (isDbReady()) {
      userRecord = await User.create({ email, passwordHash });
    } else {
      userRecord = createUser(email, passwordHash);
    }

    const user = serializeUser(userRecord);
    const token = createToken(user);
    return res.status(201).json({ token, user });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to register right now.' });
  }
}

async function login(req, res) {
  try {
    const email = sanitizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userRecord = await findExistingUser(email);
    if (!userRecord) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordHash = userRecord.passwordHash || '';
    const validPassword = await bcrypt.compare(password, passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = serializeUser(userRecord);
    const token = createToken(user);
    return res.json({ token, user });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to log in right now.' });
  }
}

function me(req, res) {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  return res.json({ user: req.user });
}

module.exports = {
  register,
  login,
  me
};
