const Venue = require('../models/Venue');

/**
 * Create a new Venue
 * @route POST /api/venues
 * @access Private (Admin only)
 */
const createVenue = async (req, res) => {
  try {
    const { name, location, rows, cols, seatCategories } = req.body;

    // Validate required fields
    if (!name || !location || !rows || !cols) {
      return res.status(400).json({
        status: 'fail',
        message: 'Name, location, rows, and cols are required fields.'
      });
    }

    if (rows <= 0 || cols <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Rows and columns must be positive numbers.'
      });
    }

    const venue = new Venue({
      name,
      location,
      rows,
      cols,
      seatCategories: seatCategories || []
    });

    await venue.save();

    return res.status(201).json({
      status: 'success',
      data: { venue }
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get all Venues
 * @route GET /api/venues
 * @access Private (Any authenticated user)
 */
const getVenues = async (req, res) => {
  try {
    const venues = await Venue.find();
    return res.status(200).json({
      status: 'success',
      results: venues.length,
      data: { venues }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get a single Venue by ID
 * @route GET /api/venues/:id
 * @access Private (Any authenticated user)
 */
const getVenueById = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({
        status: 'fail',
        message: 'Venue not found.'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { venue }
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid venue ID format.'
      });
    }
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  createVenue,
  getVenues,
  getVenueById
};
