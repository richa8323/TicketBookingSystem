const express = require('express');
const router = express.Router();
const { createEvent, getEvents, getEventById, updateEvent, deleteEvent } = require('../controllers/event');
const { protect, authorize } = require('../middlewares/auth');

// All event routes require standard JWT verification
router.use(protect);

router.route('/')
  .post(authorize('Admin', 'Organiser'), createEvent)
  .get(getEvents);

router.route('/:id')
  .get(getEventById)
  .patch(authorize('Admin', 'Organiser'), updateEvent)
  .delete(authorize('Admin', 'Organiser'), deleteEvent);

module.exports = router;
