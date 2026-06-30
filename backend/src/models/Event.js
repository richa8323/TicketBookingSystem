const mongoose = require('mongoose');

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
  }
}, {
  timestamps: true
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
