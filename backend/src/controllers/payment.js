const mongoose = require('mongoose');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { createPaymentOrder, verifyPaymentSignature } = require('../utils/payment');
const { finalizeBooking } = require('./booking');

const createOrder = async (req, res) => {
  try {
    const { eventId, seatIds } = req.body;

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

    // Recalculate price from DB
    const event = await Event.findById(eventId).populate('venue');
    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found.'
      });
    }

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

      // Check reservation status
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

      const category = event.venue?.seatCategories?.find(cat => cat.name === eventSeat.category);
      const multiplier = category ? category.priceMultiplier : 1.0;
      totalAmount += event.basePrice * multiplier;
    }

    // Convert totalAmount (INR) to paise
    const amountInPaise = Math.round(totalAmount * 100);
    const receiptReference = `RCPT-${Date.now()}-${req.user._id.toString().substring(18)}`;

    const order = await createPaymentOrder(amountInPaise, receiptReference);

    return res.status(200).json({
      status: 'success',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      }
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const {
      eventId,
      seatIds,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        status: 'fail',
        message: 'Missing required payment verification fields.'
      });
    }

    // Validate eventId format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid event ID format.'
      });
    }

    // Validate seatIds array structure
    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Seat IDs must be a non-empty array.'
      });
    }

    // 1. Verify HMAC Signature
    const isSignatureValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isSignatureValid) {
      return res.status(400).json({
        status: 'fail',
        message: 'Payment verification failed. Invalid signature.'
      });
    }

    // 2. Idempotency Check: Prevent duplicate verify requests from creating multiple bookings
    const existingBooking = await Booking.findOne({
      $or: [
        { 'paymentDetails.orderId': razorpay_order_id },
        { 'paymentDetails.paymentId': razorpay_payment_id }
      ]
    });

    if (existingBooking) {
      return res.status(409).json({
        status: 'fail',
        message: 'Payment already processed.'
      });
    }

    // 3. Finalize Booking using the dry helper
    const bookingObj = await finalizeBooking({
      user: req.user,
      eventId,
      seatIds,
      paymentDetails: {
        provider: 'razorpay',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      }
    });

    return res.status(200).json({
      status: 'success',
      data: { booking: bookingObj }
    });

  } catch (error) {
    if (error.message === 'Payment already processed.' || error.statusCode === 409) {
      return res.status(409).json({
        status: 'fail',
        message: 'Payment already processed.'
      });
    }
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment
};
