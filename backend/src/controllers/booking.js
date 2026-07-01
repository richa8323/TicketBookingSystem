const mongoose = require('mongoose');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Event = require('../models/Event');

/**
 * Create a new booking from reserved seats
 * @route POST /api/bookings
 * @access Private (Customer only)
 */
const createBooking = async (req, res) => {
  try {
    const { eventId, seatIds } = req.body;

    // 1. Validate inputs
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid event ID format.'
      });
    }

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Seat IDs must be a non-empty array.'
      });
    }

    // 2. Fetch event with venue categories populated
    const event = await Event.findById(eventId).populate('venue');
    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found.'
      });
    }

    // 3. Verify that the current user holds active reservations
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    let totalAmount = 0;

    for (const seatId of seatIds) {
      const eventSeat = event.seats.find(s => s.seatId === seatId);
      if (!eventSeat) {
        return res.status(400).json({
          status: 'fail',
          message: `Seat ${seatId} does not exist for this event.`
        });
      }

      if (
        eventSeat.status !== 'reserved' ||
        eventSeat.reservedBy?.toString() !== req.user._id.toString() ||
        !eventSeat.reservedAt ||
        eventSeat.reservedAt < fiveMinutesAgo
      ) {
        return res.status(409).json({
          status: 'fail',
          message: `Reservation for seat ${seatId} is expired, invalid, or held by another user.`
        });
      }

      // Compute pricing based on seat category and multiplier
      const category = event.venue?.seatCategories?.find(cat => cat.name === eventSeat.category);
      const multiplier = category ? category.priceMultiplier : 1.0;
      totalAmount += event.basePrice * multiplier;
    }

    // 4. Atomic MongoDB Seat State Transition (reserved -> booked)
    const query = {
      _id: eventId,
      seats: {
        $all: seatIds.map(id => ({
          $elemMatch: {
            seatId: id,
            status: 'reserved',
            reservedBy: req.user._id,
            reservedAt: { $gte: fiveMinutesAgo }
          }
        }))
      }
    };

    const update = {
      $set: {
        "seats.$[elem].status": "booked",
        "seats.$[elem].reservedBy": null,
        "seats.$[elem].reservedAt": null
      }
    };

    const options = {
      arrayFilters: [
        {
          "elem.seatId": { $in: seatIds },
          "elem.status": "reserved",
          "elem.reservedBy": req.user._id
        }
      ],
      new: true
    };

    const updatedEvent = await Event.findOneAndUpdate(query, update, options);
    if (!updatedEvent) {
      return res.status(409).json({
        status: 'fail',
        message: 'Booking conflict. One or more seat holds expired or changed status.'
      });
    }

    // 5. Generate collision-resistant unique booking reference
    const bookingReference = `BOOK-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    // 6. Persist Booking Document
    try {
      const booking = new Booking({
        user: req.user._id,
        event: eventId,
        seats: seatIds,
        totalAmount,
        bookingReference,
        status: 'confirmed'
      });

      await booking.save();

      return res.status(200).json({
        status: 'success',
        data: { booking }
      });
    } catch (err) {
      // Revert seat states back to available if database persist fails
      if (err.code === 11000) {
        // Rollback booked seats back to available so they can be re-attempted
        await Event.updateOne(
          { _id: eventId },
          { $set: { "seats.$[elem].status": "available" } },
          { arrayFilters: [{ "elem.seatId": { $in: seatIds } }] }
        );
        
        return res.status(500).json({
          status: 'error',
          message: 'Booking reference collision. Please retry.'
        });
      }
      throw err;
    }

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get booking history of the authenticated user
 * @route GET /api/bookings/my
 * @access Private (Customer only)
 */
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'event',
        populate: { path: 'venue' }
      });

    return res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: { bookings }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get a single booking by ID
 * @route GET /api/bookings/:id
 * @access Private (Customer only)
 */
const getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;

    // 1. Validate Mongo ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid booking ID format.'
      });
    }

    // 2. Fetch booking and populate event+venue references
    const booking = await Booking.findById(bookingId).populate({
      path: 'event',
      populate: { path: 'venue' }
    });

    if (!booking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Booking not found.'
      });
    }

    // 3. Enforce ownership validation
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to view this ticket.'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { booking }
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Cancel a confirmed booking and release seats
 * @route PATCH /api/bookings/:id/cancel
 * @access Private (Customer only)
 */
const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid booking ID format."
      });
    }

    const booking = await Booking.findById(bookingId).populate("event");

    if (!booking) {
      return res.status(404).json({
        status: "fail",
        message: "Booking not found."
      });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to cancel this booking."
      });
    }

    if (booking.status === "cancelled") {
      return res.status(409).json({
        status: "fail",
        message: "Booking is already cancelled."
      });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        status: "fail",
        message: "Only confirmed bookings can be cancelled."
      });
    }

    const eventDate = new Date(booking.event.date);
    const [hours, minutes] = booking.event.endTime.split(":");
    let hrs = parseInt(hours, 10);
    let mins = parseInt(minutes, 10);
    if (booking.event.endTime.toLowerCase().includes("pm") && hrs < 12) hrs += 12;
    if (booking.event.endTime.toLowerCase().includes("am") && hrs === 12) hrs = 0;
    
    const eventEndDateTime = new Date(eventDate);
    eventEndDateTime.setHours(hrs, mins, 0, 0);

    if (new Date() > eventEndDateTime) {
      return res.status(409).json({
        status: "fail",
        message: "Past events cannot be cancelled."
      });
    }

    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        user: req.user._id,
        status: "confirmed"
      },
      {
        $set: { status: "cancelled" }
      },
      {
        new: true
      }
    );

    if (!updatedBooking) {
      return res.status(409).json({
        status: "fail",
        message: "Booking is already cancelled."
      });
    }

    try {
      await Event.updateOne(
        { _id: booking.event._id },
        {
          $set: {
            "seats.$[elem].status": "available",
            "seats.$[elem].reservedBy": null,
            "seats.$[elem].reservedAt": null
          }
        },
        {
          arrayFilters: [{ "elem.seatId": { $in: booking.seats } }]
        }
      );
    } catch (dbError) {
      await Booking.updateOne(
        { _id: bookingId },
        { $set: { status: "confirmed" } }
      );
      throw dbError;
    }

    return res.status(200).json({
      status: "success",
      message: "Booking cancelled successfully."
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking
};
