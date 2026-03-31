// Purpose: Express entrypoint for the MERN backend API.
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const connectDb = require('./config/db');
const resumeRoutes = require('./routes/resume.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/resume', resumeRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`[server] running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[server] failed to start:', error.message);
    process.exit(1);
  }
}

start();
