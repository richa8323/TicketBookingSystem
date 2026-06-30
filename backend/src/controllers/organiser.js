const Event = require('../models/Event');

/**
 * Fetch dashboard statistics for the logged-in organiser
 * @route GET /api/organiser/dashboard
 * @access Private (Organiser only)
 */
const getOrganiserDashboardStats = async (req, res) => {
  try {
    const eventsCount = await Event.countDocuments({ organiser: req.user._id });

    // Tickets sold and revenue return 0 for now as per requirements
    return res.status(200).json({
      status: 'success',
      data: {
        eventsCount,
        ticketsSold: 0,
        revenue: 0
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Fetch all events created by the logged-in organiser
 * @route GET /api/organiser/events
 * @access Private (Organiser only)
 */
const getOrganiserEvents = async (req, res) => {
  try {
    const events = await Event.find({ organiser: req.user._id }).populate('venue');

    return res.status(200).json({
      status: 'success',
      results: events.length,
      data: { events }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  getOrganiserDashboardStats,
  getOrganiserEvents
};
