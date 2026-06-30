const express = require('express');
const router = express.Router();
const { createVenue, getVenues, getVenueById } = require('../controllers/venue');
const { protect, authorize } = require('../middlewares/auth');

// All venue routes require standard JWT verification
router.use(protect);

router.route('/')
  .post(authorize('Admin'), createVenue)
  .get(getVenues);

router.route('/:id')
  .get(getVenueById);

module.exports = router;
