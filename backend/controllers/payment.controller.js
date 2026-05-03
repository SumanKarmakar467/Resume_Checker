const crypto = require('crypto');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');

const paymentRepository = require('../repositories/payment.repository');
const { normalizeUserEmail, markUserAsPro, isUserPro } = require('../services/records.service');

const PLAN_AMOUNT_PAISE = 19900;
const PLAN_NAME = 'PRO';

function getKeyId() {
  return String(process.env.RAZORPAY_KEY_ID || '').trim();
}

function getKeySecret() {
  return String(process.env.RAZORPAY_KEY_SECRET || '').trim();
}

function createClient() {
  const keyId = getKeyId();
  const keySecret = getKeySecret();
  if (!keyId || !keySecret) {
    const error = new Error('Razorpay keys are not configured.');
    error.status = 500;
    throw error;
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

async function createOrderController(req, res, next) {
  try {
    const userEmail = normalizeUserEmail(req.body?.userEmail);
    if (!userEmail || userEmail === 'anonymous') {
      const error = new Error('userEmail is required to create an order.');
      error.status = 400;
      throw error;
    }

    const client = createClient();
    const order = await client.orders.create({
      amount: PLAN_AMOUNT_PAISE,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { userEmail, plan: PLAN_NAME },
    });

    if (mongoose.connection.readyState === 1) {
      try {
        await paymentRepository.createRecord({
          userId: userEmail,
          razorpayOrderId: order.id,
          plan: PLAN_NAME,
          amount: PLAN_AMOUNT_PAISE,
          status: 'CREATED',
        });
      } catch (saveError) {
        console.warn('[payment] failed to save created order:', saveError.message);
      }
    }

    return res.status(201).json(order);
  } catch (error) {
    return next(error);
  }
}

async function verifyPaymentController(req, res, next) {
  try {
    const userEmail = normalizeUserEmail(req.body?.userEmail);
    const orderId = String(req.body?.razorpay_order_id || '').trim();
    const paymentId = String(req.body?.razorpay_payment_id || '').trim();
    const signature = String(req.body?.razorpay_signature || '').trim();

    if (!userEmail || userEmail === 'anonymous' || !orderId || !paymentId || !signature) {
      const error = new Error('Invalid payment verification payload.');
      error.status = 400;
      throw error;
    }

    const payload = `${orderId}|${paymentId}`;
    const expected = crypto.createHmac('sha256', getKeySecret()).update(payload).digest('hex');
    const valid = expected === signature;

    if (!valid) {
      return res.status(400).json({ status: 'failed' });
    }

    if (mongoose.connection.readyState === 1) {
      try {
        await paymentRepository.markSuccess(orderId, paymentId);
      } catch (saveError) {
        console.warn('[payment] failed to mark payment success:', saveError.message);
      }
    }

    await markUserAsPro(userEmail);
    return res.status(200).json({ status: 'success', isPro: true, plan: PLAN_NAME });
  } catch (error) {
    return next(error);
  }
}

async function paymentStatusController(req, res, next) {
  try {
    const userEmail = normalizeUserEmail(req.query?.userEmail || req.body?.userEmail);
    if (!userEmail || userEmail === 'anonymous') {
      return res.status(200).json({ isPro: false, plan: 'FREE' });
    }

    const pro = await isUserPro(userEmail);
    return res.status(200).json({ isPro: pro, plan: pro ? 'PRO' : 'FREE' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createOrderController,
  verifyPaymentController,
  paymentStatusController,
};

