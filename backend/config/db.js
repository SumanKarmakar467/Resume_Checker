// Purpose: Initialize and export a reusable MongoDB connection helper.
const mongoose = require('mongoose');

async function connectDb() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('[db] MONGODB_URI is missing. Running without MongoDB (in-memory mode).');
    return false;
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 15000,
  });

  console.log('[db] MongoDB connected');
  return true;
}

module.exports = connectDb;
