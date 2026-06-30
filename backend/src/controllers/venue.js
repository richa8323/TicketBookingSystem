const Venue = require('../models/Venue');
const { generateSeatLayout } = require('../utils/seatGenerator');

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

    // Validate seat categories
    if (!seatCategories || !Array.isArray(seatCategories) || seatCategories.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'At least one seat category is required.'
      });
    }

    const uniqueNames = new Set();
    const validatedCategories = [];

    for (const category of seatCategories) {
      if (!category.name || typeof category.name !== 'string' || category.name.trim() === '') {
        return res.status(400).json({
          status: 'fail',
          message: 'Seat category name must be a non-empty string.'
        });
      }

      const cleanName = category.name.trim();
      if (uniqueNames.has(cleanName)) {
        return res.status(400).json({
          status: 'fail',
          message: `Duplicate seat category name detected: ${cleanName}`
        });
      }
      uniqueNames.add(cleanName);

      const multiplier = Number(category.priceMultiplier);
      if (isNaN(multiplier) || multiplier <= 0) {
        return res.status(400).json({
          status: 'fail',
          message: `Price multiplier for category "${cleanName}" must be a positive number.`
        });
      }

      validatedCategories.push({
        name: cleanName,
        priceMultiplier: multiplier
      });
    }

    // Generate seats based on layout grid configuration and custom categories
    const seats = generateSeatLayout(rows, cols, validatedCategories);

    const venue = new Venue({
      name,
      location,
      rows,
      cols,
      seatCategories: validatedCategories,
      seats
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
