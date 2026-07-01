const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { createBooking, getMyBookings, getBookingById, cancelBooking } = require('../controllers/booking');

router.post('/', protect, authorize('Customer'), createBooking);
router.get('/my', protect, authorize('Customer'), getMyBookings);
router.get('/:id', protect, authorize('Customer'), getBookingById);
router.patch('/:id/cancel', protect, authorize('Customer'), cancelBooking);

module.exports = router;
