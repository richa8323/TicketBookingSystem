const mongoose = require('mongoose');

const eventSeatSchema = new mongoose.Schema({
  seatId: {
    type: String,
    required: [true, 'Seat ID is required']
  },
  row: {
    type: String,
    required: [true, 'Row label is required']
  },
  number: {
    type: Number,
    required: [true, 'Seat number is required']
  },
  category: {
    type: String,
    required: [true, 'Seat category is required']
  },
  status: {
    type: String,
    required: true,
    enum: ['available', 'reserved', 'booked'],
    default: 'available'
  },
  reservedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reservedAt: {
    type: Date,
    default: null
  }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: [true, 'Venue reference is required']
  },
  organiser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Organiser reference is required']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Please fill a valid start time format (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Please fill a valid end time format (HH:MM)']
  },
  basePrice: {
    type: Number,
    required: [true, 'Base ticket price is required'],
    min: [0.01, 'Base price must be positive']
  },
  posterUrl: {
    type: String,
    trim: true
  },
  seats: [eventSeatSchema]
}, {
  timestamps: true
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
