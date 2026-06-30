const User = require('../models/User');

/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Name, email, and password are required'
      });
    }

    // Basic password length validation
    if (password.length < 6) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password must be at least 6 characters long'
      });
    }

    // Role validation
    const allowedRoles = ['Admin', 'Organiser', 'Customer'];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        status: 'fail',
        message: `Role must be one of: ${allowedRoles.join(', ')}`
      });
    }

    // Check for duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: 'fail',
        message: 'An account with this email address already exists'
      });
    }

    // Create and save new user
    // Note: Password hashing occurs automatically via the User pre-save hook
    const user = new User({
      name,
      email,
      password,
      role: role || 'Customer'
    });

    await user.save();

    // Generate response object without password hash
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = { register };
