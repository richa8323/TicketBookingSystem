const express = require('express');
const router = express.Router();
const { createEvent, getEvents, getEventById } = require('../controllers/event');
const { protect, authorize } = require('../middlewares/auth');

// All event routes require standard JWT verification
router.use(protect);

router.route('/')
  .post(authorize('Admin'), createEvent)
  .get(getEvents);

router.route('/:id')
  .get(getEventById);

module.exports = router;
