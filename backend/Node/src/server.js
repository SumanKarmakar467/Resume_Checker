const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const resumeRoutes = require('./routes/resumeRoutes');
const { connectDb } = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/resume', resumeRoutes);

app.use((err, req, res, next) => {
  if (err && err.message && err.message.includes('Only PDF and DOCX files')) {
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
