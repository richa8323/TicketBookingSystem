/**
 * Fetch dashboard statistics for the logged-in customer
 * @route GET /api/customer/dashboard
 * @access Private (Customer only)
 */
const getCustomerDashboardStats = async (req, res) => {
  try {
    // Default values since Booking model is not yet implemented
    return res.status(200).json({
      status: 'success',
      data: {
        totalBookings: 0,
        totalSpent: 0
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
 * Fetch booking history for the logged-in customer
 * @route GET /api/customer/bookings
 * @access Private (Customer only)
 */
const getCustomerBookings = async (req, res) => {
  try {
    // Default empty array since Booking model is not yet implemented
    return res.status(200).json({
      status: 'success',
      results: 0,
      data: {
        bookings: []
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
  getCustomerDashboardStats,
  getCustomerBookings
};
