const Event = require('../models/Event');
const Booking = require('../models/Booking');

/**
 * Fetch dashboard analytics statistics
 * @route GET /api/organiser/dashboard
 * @access Private (Admin and Organiser only)
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    // 1. Fetch matching events based on role scoping
    const eventFilter = req.user.role === 'Admin' ? {} : { organiser: req.user._id };
    const events = await Event.find(eventFilter);
    
    const eventsCount = events.length;
    const eventIds = events.map(e => e._id);

    // 2. Fetch confirmed bookings for these events
    const bookings = await Booking.find({
      event: { $in: eventIds },
      status: 'confirmed'
    });

    // 3. Compute metrics
    const ticketsSold = bookings.reduce((sum, b) => sum + b.seats.length, 0);
    const revenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

    // Compute total seats capacity
    const totalSeats = events.reduce((sum, e) => sum + (e.seats?.length || 0), 0);
    const averageOccupancy = totalSeats > 0 ? Number(((ticketsSold / totalSeats) * 100).toFixed(1)) : 0;

    // 4. Compute event-by-event performance list
    const eventPerformance = events.map(event => {
      const eventBookings = bookings.filter(b => b.event.toString() === event._id.toString());
      
      const sold = eventBookings.reduce((sum, b) => sum + b.seats.length, 0);
      const capacity = event.seats?.length || 0;
      const occupancy = capacity > 0 ? Number(((sold / capacity) * 100).toFixed(1)) : 0;
      const sales = eventBookings.reduce((sum, b) => sum + b.totalAmount, 0);

      return {
        _id: event._id,
        title: event.title,
        date: event.date,
        ticketsSold: sold,
        totalSeats: capacity,
        occupancyPercent: occupancy,
        revenue: sales
      };
    });

    return res.status(200).json({
      status: 'success',
      data: {
        eventsCount,
        ticketsSold,
        revenue,
        averageOccupancy,
        eventPerformance
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
  getDashboardAnalytics,
  getOrganiserEvents
};
