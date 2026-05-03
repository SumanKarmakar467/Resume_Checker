const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, trim: true, lowercase: true, index: true },
    razorpayOrderId: { type: String, required: true, trim: true, index: true },
    razorpayPaymentId: { type: String, default: '', trim: true },
    plan: { type: String, enum: ['PRO'], default: 'PRO' },
    amount: { type: Number, required: true, default: 19900 },
    status: { type: String, enum: ['CREATED', 'SUCCESS', 'FAILED'], default: 'CREATED' },
    paidAt: { type: Date, default: null },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema);

