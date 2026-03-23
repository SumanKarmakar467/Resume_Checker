const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const resumeRoutes = require('./routes/resumeRoutes');
const authRoutes = require('./routes/authRoutes');
const historyRoutes = require('./routes/historyRoutes');
const { connectDb } = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:5173,http://127.0.0.1:5173,https://resume-checker-alpha-two.vercel.app'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin/non-browser requests (no Origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      return callback(new Error('CORS not allowed for this origin'));
    }
  })
);
app.use(express.json({ limit: '5mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/resume', resumeRoutes);

app.use((err, req, res, next) => {
  if (err && err.message && /Only PDF/i.test(err.message)) {
    return res.status(400).json({ error: err.message });
  }

  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Max size is 10MB.' });
  }

  return res.status(500).json({ error: 'Unexpected server error.' });
});

connectDb().finally(() => {
  app.listen(PORT, () => {
    console.log(`ATS backend running on http://localhost:${PORT}`);
  });
});
