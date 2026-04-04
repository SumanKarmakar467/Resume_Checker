// Purpose: Express entrypoint for the MERN backend API.
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const connectDb = require('./config/db');
const resumeRoutes = require('./routes/resume.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const BOOT_TIME = Date.now();
let storageMode = 'in-memory';

function getMongoReadyStateLabel() {
  const labels = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return labels[mongoose.connection.readyState] || 'unknown';
}

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'resume-checker-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    startedAt: new Date(BOOT_TIME).toISOString(),
    storageMode,
    database: {
      connected: mongoose.connection.readyState === 1,
      readyState: getMongoReadyStateLabel(),
    },
  });
});

app.use('/api/resume', resumeRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  let dbConnected = false;
  try {
    dbConnected = await connectDb();
  } catch (error) {
    console.warn(`[server] MongoDB unavailable: ${error.message}`);
    console.warn('[server] Continuing in in-memory mode.');
  }
  storageMode = dbConnected ? 'mongodb' : 'in-memory';

  app.listen(PORT, () => {
    console.log(`[server] running on http://localhost:${PORT}`);
    console.log(`[server] storage mode: ${storageMode}`);
  });
}

start();
