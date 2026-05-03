const express = require('express');
const {
  createOrderController,
  verifyPaymentController,
  paymentStatusController,
} = require('../controllers/payment.controller');

const router = express.Router();

router.post('/create-order', createOrderController);
router.post('/verify', verifyPaymentController);
router.get('/status', paymentStatusController);

module.exports = router;

