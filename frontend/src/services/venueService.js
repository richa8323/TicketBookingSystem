import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/venues`;

/**
 * Fetch all venues from backend
 */
const getVenues = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

/**
 * Create a new venue
 * @param {Object} venueData - Venue details (name, location, rows, cols, seatCategories)
 */
const createVenue = async (venueData) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(API_URL, venueData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export default {
  getVenues,
  createVenue
};
