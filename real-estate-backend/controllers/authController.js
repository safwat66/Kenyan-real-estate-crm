const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Sequelize } = require('sequelize'); // Add this import
const { User } = require('../models');
const { logActivity } = require('../utils/logger');

const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Check if user already exists - FIXED SYNTAX
    const existingUser = await User.findOne({ 
      where: { 
        [Sequelize.Op.or]: [  // Correct Sequelize syntax
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'salesperson'
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    await logActivity('user_registered', 'user', user.id, { username, email, role }, user.id, req);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ 
      where: { 
        [Sequelize.Op.or]: [  // Correct Sequelize syntax
          { username },
          { email: username }
        ],
        isActive: true
      }
    });

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    await logActivity('user_login', 'user', user.id, { loginTime: new Date() }, user.id, req);

    res.json({
      message: 'Login successful',
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login
};