// Purpose: Initialize and export a reusable MongoDB connection helper.
const dns = require('dns');
const mongoose = require('mongoose');

function configureMongoDns() {
  const rawServers = process.env.MONGODB_DNS_SERVERS || '8.8.8.8,1.1.1.1';
  const servers = rawServers
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (!servers.length) return;

  try {
    dns.setServers(servers);
  } catch (error) {
    console.warn(`[db] Could not configure DNS servers for MongoDB SRV lookup: ${error.message}`);
  }
}

async function connectDb() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('[db] MONGODB_URI is missing. Running without MongoDB (in-memory mode).');
    return false;
  }

  mongoose.set('strictQuery', true);
  configureMongoDns();

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 15000,
  });

  console.log('[db] MongoDB connected');
  return true;
}

module.exports = connectDb;
