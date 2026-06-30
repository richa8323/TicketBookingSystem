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
  seatCategories: [seatCategorySchema]
}, {
  timestamps: true
});

const Venue = mongoose.model('Venue', venueSchema);

module.exports = Venue;
