const mongoose = require('mongoose');

async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[DB] MONGODB_URI not set. Running without database persistence.');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('[DB] MongoDB connected.');
  } catch (error) {
    console.error('[DB] MongoDB connection failed:', error.message);
    console.log('[DB] Continuing without persistence.');
  }
}

module.exports = { connectDb };
