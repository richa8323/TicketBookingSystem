import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/events`;

/**
 * Fetch all events from backend
 */
const getEvents = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

/**
 * Create a new event
 * @param {Object} eventData - Event details
 */
const createEvent = async (eventData) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(API_URL, eventData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export default {
  getEvents,
  createEvent
};
