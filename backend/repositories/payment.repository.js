const Payment = require('../models/Payment');

async function createRecord(payload = {}) {
  return Payment.create(payload);
}

async function findSuccessfulByUser(userId) {
  return Payment.findOne({ userId, status: 'SUCCESS' }).sort({ paidAt: -1 }).lean();
}

async function markSuccess(orderId, paymentId) {
  return Payment.findOneAndUpdate(
    { razorpayOrderId: orderId },
    {
      $set: {
        razorpayPaymentId: paymentId,
        status: 'SUCCESS',
        paidAt: new Date(),
      },
    },
    { new: true, lean: true }
  );
}

module.exports = {
  createRecord,
  findSuccessfulByUser,
  markSuccess,
};

