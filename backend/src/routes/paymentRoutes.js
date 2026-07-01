const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../controllers/payment');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.use(authorize('Customer'));

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

module.exports = router;
