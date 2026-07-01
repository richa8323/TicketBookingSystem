const Event = require('../models/Event');
const Venue = require('../models/Venue');
const mongoose = require('mongoose');

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
 * Helper to release stale seat reservations (older than 5 minutes) for a specific event.
 * Scoped by eventId for performance optimization.
 * @param {string} eventId
 */
const expireStaleReservations = async (eventId) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    await Event.updateOne(
      { 
        _id: eventId,
        "seats.status": "reserved", 
        "seats.reservedAt": { $lt: fiveMinutesAgo } 
      },
      { 
        $set: { 
          "seats.$[elem].status": "available",
          "seats.$[elem].reservedBy": null,
          "seats.$[elem].reservedAt": null
        } 
      },
      { 
        arrayFilters: [{ "elem.status": "reserved", "elem.reservedAt": { $lt: fiveMinutesAgo } }] 
      }
    );
  } catch (err) {
    console.error(`Failed to expire stale reservations for event ${eventId}:`, err);
  }
};

/**
 * Create a new Event
 * @route POST /api/events
 * @access Private (Admin and Organiser only)
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
      organiser: req.user._id,
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
    const { search, venue, date } = req.query;
    const filterQuery = {};

    // 1. Title Search (case-insensitive regex match)
    if (search) {
      filterQuery.title = { $regex: search, $options: 'i' };
    }

    // 2. Venue ID Filter (validate ObjectId format)
    if (venue) {
      if (!mongoose.Types.ObjectId.isValid(venue)) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid venue ID format.'
        });
      }
      filterQuery.venue = venue;
    }

    // 3. Date Filter (matches events on the specific day)
    if (date) {
      const eventDate = new Date(date);
      if (isNaN(eventDate.getTime())) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid date format. Please use YYYY-MM-DD.'
        });
      }
      
      const startOfDay = new Date(eventDate);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(eventDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      filterQuery.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    // Fetch and sort chronologically by date ascending
    const events = await Event.find(filterQuery)
      .sort({ date: 1 })
      .populate('venue');

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
    const eventId = req.params.id;

    // Prune stale holds specifically for this event ID
    await expireStaleReservations(eventId);

    const event = await Event.findById(eventId).populate('venue');
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
 * @access Private (Admin and Organiser only)
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

    // Authorization checks: Admin can modify any event, Organiser only their own
    if (req.user.role !== 'Admin' && event.organiser.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action.'
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
 * @access Private (Admin and Organiser only)
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

    // Authorization checks: Admin can modify any event, Organiser only their own
    if (req.user.role !== 'Admin' && event.organiser.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action.'
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

/**
 * Temporary seat reservation (Seat Lock)
 * @route POST /api/events/:id/reserve
 * @access Private (Customer only)
 */
const reserveSeats = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { seatIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid event ID format.'
      });
    }

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'At least one seat ID must be provided to reserve.'
      });
    }

    // Prune stale holds specifically for this event ID
    await expireStaleReservations(eventId);

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found.'
      });
    }

    // Check if all requested seat IDs exist in the event
    const requestedSeats = event.seats.filter(s => seatIds.includes(s.seatId));
    if (requestedSeats.length !== seatIds.length) {
      return res.status(400).json({
        status: 'fail',
        message: 'Some of the selected seats do not exist in this venue.'
      });
    }

    // Verify availability
    const unavailableSeats = requestedSeats.filter(s => s.status !== 'available');
    if (unavailableSeats.length > 0) {
      return res.status(400).json({
        status: 'fail',
        message: `The following seats are already reserved or booked: ${unavailableSeats.map(s => s.seatId).join(', ')}`
      });
    }

    // Concurrency Safe Atomic Update
    const query = {
      _id: eventId,
      seats: {
        $all: seatIds.map(id => ({
          $elemMatch: { seatId: id, status: 'available' }
        }))
      }
    };

    const update = {
      $set: {
        "seats.$[elem].status": "reserved",
        "seats.$[elem].reservedBy": req.user._id,
        "seats.$[elem].reservedAt": new Date()
      }
    };

    const options = {
      arrayFilters: [
        {
          "elem.seatId": { $in: seatIds },
          "elem.status": "available"
        }
      ],
      new: true
    };

    const updatedEvent = await Event.findOneAndUpdate(query, update, options);
    if (!updatedEvent) {
      return res.status(409).json({
        status: 'fail',
        message: 'Reservation conflict. One or more seats were locked by another user. Please choose different seats.'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        reservedSeats: seatIds,
        expiresInSeconds: 300
      }
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
  deleteEvent,
  reserveSeats
};
