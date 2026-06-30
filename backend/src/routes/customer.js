const express = require('express');
const router = express.Router();
const { getCustomerDashboardStats, getCustomerBookings } = require('../controllers/customer');
const { protect, authorize } = require('../middlewares/auth');

// All customer dashboard routes require standard protect and role check
router.use(protect, authorize('Customer'));

router.get('/dashboard', getCustomerDashboardStats);
router.get('/bookings', getCustomerBookings);

module.exports = router;
