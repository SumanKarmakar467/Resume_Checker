const mongoose = require('mongoose');

const UserRecordSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, index: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model('UserRecord', UserRecordSchema);
