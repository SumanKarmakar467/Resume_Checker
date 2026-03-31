// Purpose: Initialize and export a reusable MongoDB connection helper.
const mongoose = require('mongoose');

async function connectDb() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing. Add it to backend/.env.');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 15000,
  });

  console.log('[db] MongoDB connected');
}

module.exports = connectDb;
