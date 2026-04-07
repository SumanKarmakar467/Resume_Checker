const mongoose = require('mongoose');

const BuildRecordSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
    templateName: { type: String, default: '' },
    builtAt: { type: Date, default: Date.now, index: true },
    downloadCount: { type: Number, default: 0, min: 0 },
  },
  { versionKey: false }
);

module.exports = mongoose.model('BuildRecord', BuildRecordSchema);
