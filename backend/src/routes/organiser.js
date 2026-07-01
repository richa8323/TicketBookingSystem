const express = require('express');
const router = express.Router();
const { getDashboardAnalytics, getOrganiserEvents } = require('../controllers/organiser');
const { protect, authorize } = require('../middlewares/auth');

// Scoped endpoints with distinct role rules
router.get('/dashboard', protect, authorize('Admin', 'Organiser'), getDashboardAnalytics);
router.get('/events', protect, authorize('Organiser'), getOrganiserEvents);

module.exports = router;
