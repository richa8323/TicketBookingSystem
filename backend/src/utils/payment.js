const Razorpay = require('razorpay');
const crypto = require('crypto');

// Fail-fast validation of critical gateway credentials on startup
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('Missing Razorpay credentials: RAZORPAY_KEY_ID and/or RAZORPAY_KEY_SECRET');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createPaymentOrder = async (amountInPaise, receiptReference) => {
  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: receiptReference
  };
  return razorpay.orders.create(options);
};

const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (!signature || !orderId || !paymentId) return false;

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(orderId + "|" + paymentId)
    .digest('hex');

  const genBuf = Buffer.from(generatedSignature);
  const sigBuf = Buffer.from(signature);

  // Timing-safe equal requires matching buffer lengths to avoid throwing TypeErrors
  if (genBuf.length !== sigBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(genBuf, sigBuf);
};

module.exports = {
  createPaymentOrder,
  verifyPaymentSignature
};
