const Event = require('../models/Event');
const Venue = require('../models/Venue');

/**
 * Helper to parse HH:MM strings into numeric minutes for duration comparisons
 * @param {string} timeStr - Time string formatted as "HH:MM"
 * @returns {number}
 */
const timeToMinutes = (timeStr) => {
  const parts = timeStr.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
};

/**
 * Create a new Event
 * @route POST /api/events
 * @access Private (Admin only)
 */
const createEvent = async (req, res) => {
  try {
    const { title, description, venue, date, startTime, endTime, basePrice, posterUrl } = req.body;

    // Required fields check
    if (!title || !venue || !date || !startTime || !endTime || !basePrice) {
      return res.status(400).json({
        status: 'fail',
        message: 'Title, venue, date, startTime, endTime, and basePrice are required.'
      });
    }

    // Validate basePrice
    const priceNum = Number(basePrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Base price must be a positive number.'
      });
    }

    // Validate Event Date
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid event date format.'
      });
    }

    // Validate time bounds (endTime must be after startTime)
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    if (endMins <= startMins) {
      return res.status(400).json({
        status: 'fail',
        message: 'End time must be chronologically after the start time.'
      });
    }

    // Validate Venue existence in database
    const existingVenue = await Venue.findById(venue);
    if (!existingVenue) {
      return res.status(404).json({
        status: 'fail',
        message: 'The selected Venue does not exist.'
      });
    }

    // Validate that the Venue contains a seat layout
    if (!existingVenue.seats || existingVenue.seats.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Selected venue has no seat layout.'
      });
    }

    // Clone every venue seat and attach booking status
    const eventSeats = existingVenue.seats.map(seat => ({
      seatId: seat.seatId,
      row: seat.row,
      number: seat.number,
      category: seat.category,
      status: 'available'
    }));

    const event = new Event({
      title,
      description,
      venue,
      date: eventDate,
      startTime,
      endTime,
      basePrice: priceNum,
      posterUrl,
      seats: eventSeats
    });

    await event.save();

    return res.status(201).json({
      status: 'success',
      data: { event }
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get all Events (with venue details populated)
 * @route GET /api/events
 * @access Private (Any authenticated user)
 */
const getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate('venue');
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

/**
 * Get a single Event by ID (with venue details populated)
 * @route GET /api/events/:id
 * @access Private (Any authenticated user)
 */
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('venue');
    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found.'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { event }
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid event ID format.'
      });
    }
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Update an existing Event
 * @route PATCH /api/events/:id
 * @access Private (Admin only)
 */
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found.'
      });
    }

    const { title, description, venue, date, startTime, endTime, basePrice, posterUrl } = req.body;

    // Validate basePrice if provided
    if (basePrice !== undefined) {
      const priceNum = Number(basePrice);
      if (isNaN(priceNum) || priceNum <= 0) {
        return res.status(400).json({
          status: 'fail',
          message: 'Base price must be a positive number.'
        });
      }
      event.basePrice = priceNum;
    }

    // Validate Event Date if provided
    if (date !== undefined) {
      const eventDate = new Date(date);
      if (isNaN(eventDate.getTime())) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid event date format.'
        });
      }
      event.date = eventDate;
    }

    // Validate times if provided
    if (startTime !== undefined || endTime !== undefined) {
      const finalStart = startTime !== undefined ? startTime : event.startTime;
      const finalEnd = endTime !== undefined ? endTime : event.endTime;

      const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
      if (startTime !== undefined && !timeRegex.test(startTime)) {
        return res.status(400).json({
          status: 'fail',
          message: 'Please fill a valid start time format (HH:MM)'
        });
      }
      if (endTime !== undefined && !timeRegex.test(endTime)) {
        return res.status(400).json({
          status: 'fail',
          message: 'Please fill a valid end time format (HH:MM)'
        });
      }

      const startMins = timeToMinutes(finalStart);
      const endMins = timeToMinutes(finalEnd);
      if (endMins <= startMins) {
        return res.status(400).json({
          status: 'fail',
          message: 'End time must be chronologically after the start time.'
        });
      }
      if (startTime !== undefined) event.startTime = startTime;
      if (endTime !== undefined) event.endTime = endTime;
    }

    // Validate Venue and re-generate seats if venue is updated
    if (venue !== undefined && venue.toString() !== event.venue.toString()) {
      const existingVenue = await Venue.findById(venue);
      if (!existingVenue) {
        return res.status(404).json({
          status: 'fail',
          message: 'The selected Venue does not exist.'
        });
      }

      // Block venue change if any seat is already booked or reserved
      const hasReservedOrBookedSeats = event.seats.some(seat => seat.status !== 'available');
      if (hasReservedOrBookedSeats) {
        return res.status(400).json({
          status: 'fail',
          message: 'Cannot update venue. Some seats are already reserved or booked.'
        });
      }

      if (!existingVenue.seats || existingVenue.seats.length === 0) {
        return res.status(400).json({
          status: 'fail',
          message: 'Selected venue has no seat layout.'
        });
      }

      // Clone new venue seat layout
      const eventSeats = existingVenue.seats.map(seat => ({
        seatId: seat.seatId,
        row: seat.row,
        number: seat.number,
        category: seat.category,
        status: 'available'
      }));

      event.venue = venue;
      event.seats = eventSeats;
    }

    // Update simple fields
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (posterUrl !== undefined) event.posterUrl = posterUrl;

    await event.save();

    return res.status(200).json({
      status: 'success',
      data: { event }
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Delete an existing Event
 * @route DELETE /api/events/:id
 * @access Private (Admin only)
 */
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found.'
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      status: 'success',
      message: 'Event deleted successfully.'
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
};
