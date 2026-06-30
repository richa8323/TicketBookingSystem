const mongoose = require('mongoose');

const seatCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Seat category name is required'],
    trim: true
  },
  priceMultiplier: {
    type: Number,
    required: [true, 'Price multiplier is required'],
    default: 1
  }
}, { _id: false });

const seatSchema = new mongoose.Schema({
  seatId: {
    type: String,
    required: [true, 'Seat ID is required']
  },
  row: {
    type: String,
    required: [true, 'Seat row label is required']
  },
  number: {
    type: Number,
    required: [true, 'Seat number is required']
  },
  category: {
    type: String,
    required: [true, 'Seat category is required']
  }
}, { _id: false });

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Venue name is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  rows: {
    type: Number,
    required: [true, 'Number of rows is required'],
    min: [1, 'Rows must be at least 1']
  },
  cols: {
    type: Number,
    required: [true, 'Number of columns is required'],
    min: [1, 'Columns must be at least 1']
  },
  seatCategories: [seatCategorySchema],
  seats: [seatSchema]
}, {
  timestamps: true
});

const Venue = mongoose.model('Venue', venueSchema);

module.exports = Venue;
