const express = require('express');
const router = express.Router();
const { getOrganiserDashboardStats, getOrganiserEvents } = require('../controllers/organiser');
const { protect, authorize } = require('../middlewares/auth');

// All organiser dashboard routes require standard protect and role check
router.use(protect, authorize('Organiser'));

router.get('/dashboard', getOrganiserDashboardStats);
router.get('/events', getOrganiserEvents);

module.exports = router;
