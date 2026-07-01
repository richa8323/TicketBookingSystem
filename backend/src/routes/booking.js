const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { createBooking, getMyBookings } = require('../controllers/booking');

router.post('/', protect, authorize('Customer'), createBooking);
router.get('/my', protect, authorize('Customer'), getMyBookings);

module.exports = router;
