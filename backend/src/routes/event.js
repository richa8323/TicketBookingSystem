const express = require('express');
const router = express.Router();
const { createEvent, getEvents, getEventById, updateEvent, deleteEvent, reserveSeats } = require('../controllers/event');
const { protect, authorize } = require('../middlewares/auth');

// Public routes
router.get('/', getEvents);
router.get('/:id', getEventById);

// Protected routes (require authentication + role authorization)
router.post('/', protect, authorize('Admin', 'Organiser'), createEvent);
router.patch('/:id', protect, authorize('Admin', 'Organiser'), updateEvent);
router.delete('/:id', protect, authorize('Admin', 'Organiser'), deleteEvent);
router.post('/:id/reserve', protect, authorize('Customer'), reserveSeats);

module.exports = router;
