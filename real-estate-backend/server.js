const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();

// Import models and database
const { sequelize, User, Apartment, Unit, Tenant, Payment, ActivityLog } = require('./models');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  }
});

// Basic middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  }
});

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'User not found or inactive' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Activity logging helper
const logActivity = async (action, entityType, entityId, details, userId, req) => {
  try {
    await ActivityLog.create({
      action, entityType, entityId, details, userId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.error('Activity logging error:', error);
  }
};

// ==================== SIMPLE ROUTES (NO PARAMETERS) ====================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ 
      where: { 
        [sequelize.Sequelize.Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      username, email, password: hashedPassword, role: role || 'salesperson'
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
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ 
      where: { 
        [sequelize.Sequelize.Op.or]: [{ username }, { email: username }],
        isActive: true
      }
    });

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

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
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// APARTMENT ROUTES
app.get('/api/apartments', authenticateToken, async (req, res) => {
  try {
    const apartments = await Apartment.findAll({
      where: { userId: req.user.userId, isActive: true },
      include: [{ model: Unit, attributes: ['id', 'status', 'price'], required: false }],
      order: [['createdAt', 'DESC']]
    });

    const enrichedApartments = apartments.map(apt => {
      const units = apt.Units || [];
      const soldUnits = units.filter(unit => ['sold', 'fully_paid', 'installment'].includes(unit.status)).length;
      const reservedUnits = units.filter(unit => unit.status === 'reserved').length;
      const totalRevenue = units
        .filter(unit => ['sold', 'fully_paid'].includes(unit.status))
        .reduce((sum, unit) => sum + parseFloat(unit.price), 0);

      return {
        ...apt.toJSON(),
        soldUnits,
        reservedUnits,
        totalRevenue,
        availableUnits: apt.totalUnits - soldUnits - reservedUnits,
        occupancyRate: Math.round(((soldUnits + reservedUnits) / apt.totalUnits) * 100)
      };
    });

    res.json(enrichedApartments);
  } catch (error) {
    console.error('Get apartments error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/apartments', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { name, location, totalUnits, floors, unitsPerFloor, description, priceRange, amenities } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const apartment = await Apartment.create({
      name, location,
      totalUnits: parseInt(totalUnits),
      floors: parseInt(floors),
      unitsPerFloor: parseInt(unitsPerFloor),
      description, priceRange,
      amenities: amenities ? JSON.parse(amenities) : null,
      imageUrl,
      userId: req.user.userId
    });

    await logActivity('apartment_created', 'apartment', apartment.id, { name, location, totalUnits }, req.user.userId, req);
    req.io.emit('apartment_created', apartment);

    res.status(201).json(apartment);
  } catch (error) {
    console.error('Create apartment error:', error);
    res.status(400).json({ error: error.message });
  }
});

// UNIT ROUTES - Using query parameters instead of path parameters
app.get('/api/units', authenticateToken, async (req, res) => {
  try {
    const { apartmentId, floor, status } = req.query;

    if (!apartmentId) {
      return res.status(400).json({ error: 'apartmentId is required' });
    }

    const apartment = await Apartment.findOne({
      where: { id: apartmentId, userId: req.user.userId, isActive: true }
    });

    if (!apartment) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    const whereClause = { apartmentId };
    if (floor) whereClause.floor = floor;
    if (status && status !== 'all') whereClause.status = status;

    const units = await Unit.findAll({
      where: whereClause,
      include: [
        {
          model: Tenant,
          required: false,
          include: [{ model: Payment, required: false, order: [['paymentDate', 'DESC']], limit: 5 }]
        }
      ],
      order: [['floor', 'ASC'], ['unitNumber', 'ASC']]
    });

    res.json(units);
  } catch (error) {
    console.error('Get units error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/units', authenticateToken, async (req, res) => {
  try {
    const { apartmentId, unitNumber, floor, area, price, bedrooms, bathrooms, unitType, features } = req.body;

    if (!apartmentId) {
      return res.status(400).json({ error: 'apartmentId is required' });
    }

    const apartment = await Apartment.findOne({
      where: { id: apartmentId, userId: req.user.userId, isActive: true }
    });

    if (!apartment) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    const unit = await Unit.create({
      unitNumber, floor: parseInt(floor), area: parseFloat(area), price: parseFloat(price),
      bedrooms: parseInt(bedrooms) || 1, bathrooms: parseInt(bathrooms) || 1,
      unitType: unitType || '1br',
      features: features ? JSON.parse(features) : null,
      apartmentId: parseInt(apartmentId)
    });

    await logActivity('unit_created', 'unit', unit.id, { unitNumber, apartmentId, price }, req.user.userId, req);
    req.io.to(`apartment-${apartmentId}`).emit('unit_created', unit);

    res.status(201).json(unit);
  } catch (error) {
    console.error('Create unit error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.patch('/api/units', authenticateToken, async (req, res) => {
  try {
    const { unitId, status, notes } = req.body;

    if (!unitId) {
      return res.status(400).json({ error: 'unitId is required' });
    }

    const unit = await Unit.findByPk(unitId, {
      include: [{ model: Apartment, where: { userId: req.user.userId } }]
    });

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    const oldStatus = unit.status;
    await unit.update({ 
      status,
      ...(status === 'sold' && { soldAt: new Date() }),
      ...(status === 'reserved' && { reservedAt: new Date() })
    });

    await logActivity('unit_status_updated', 'unit', unit.id, { oldStatus, newStatus: status, notes }, req.user.userId, req);
    req.io.to(`apartment-${unit.apartmentId}`).emit('unit_updated', unit);

    res.json(unit);
  } catch (error) {
    console.error('Update unit status error:', error);
    res.status(400).json({ error: error.message });
  }
});

// TENANT ROUTES
app.get('/api/tenants', authenticateToken, async (req, res) => {
  try {
    const { search, status, apartmentId, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};
    
    if (status && status !== 'all') whereClause.status = status;
    if (search) {
      whereClause[sequelize.Sequelize.Op.or] = [
        { name: { [sequelize.Sequelize.Op.like]: `%${search}%` } },
        { email: { [sequelize.Sequelize.Op.like]: `%${search}%` } },
        { phone: { [sequelize.Sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const includeClause = [
      {
        model: Unit, required: true,
        include: [{ model: Apartment, required: true, where: { userId: req.user.userId, isActive: true } }]
      },
      { model: Payment, required: false, order: [['paymentDate', 'DESC']], limit: 3 }
    ];

    if (apartmentId) {
      includeClause[0].include[0].where.id = apartmentId;
    }

    const { count, rows: tenants } = await Tenant.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    res.json({
      tenants,
      pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit), limit: parseInt(limit) }
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tenants', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, idNumber, occupation, emergencyContact, monthlyIncome, unitId, notes, moveInDate } = req.body;

    if (!unitId) {
      return res.status(400).json({ error: 'unitId is required' });
    }

    const unit = await Unit.findByPk(unitId, {
      include: [{ model: Apartment, where: { userId: req.user.userId } }]
    });

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    if (unit.status !== 'available') {
      return res.status(400).json({ error: 'Unit is not available' });
    }

    const tenant = await Tenant.create({
      name, email, phone, idNumber, occupation, emergencyContact,
      monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
      unitId: parseInt(unitId), notes,
      moveInDate: moveInDate ? new Date(moveInDate) : null,
      status: 'current'
    });

    await unit.update({ status: 'sold' });
    await logActivity('tenant_created', 'tenant', tenant.id, { name, unitId, unitNumber: unit.unitNumber }, req.user.userId, req);
    
    req.io.to(`apartment-${unit.apartmentId}`).emit('tenant_created', {
      tenant,
      unit: { id: unit.id, unitNumber: unit.unitNumber, apartmentId: unit.apartmentId }
    });

    res.status(201).json(tenant);
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(400).json({ error: error.message });
  }
});

// DASHBOARD STATS
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const { apartmentId } = req.query;

    if (!apartmentId) {
      return res.status(400).json({ error: 'apartmentId is required' });
    }
    
    const apartment = await Apartment.findOne({
      where: { id: apartmentId, userId: req.user.userId, isActive: true },
      include: [{ model: Unit, include: [{ model: Tenant, include: [{ model: Payment, order: [['paymentDate', 'DESC']] }] }] }]
    });

    if (!apartment) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    const units = apartment.Units;
    const soldUnits = units.filter(unit => ['sold', 'fully_paid', 'installment'].includes(unit.status));
    const availableUnits = units.filter(unit => unit.status === 'available');
    const reservedUnits = units.filter(unit => unit.status === 'reserved');
    
    const totalRevenue = units.reduce((sum, unit) => {
      if (unit.Tenant && unit.Tenant.Payments) {
        return sum + unit.Tenant.Payments.reduce((paySum, payment) => paySum + parseFloat(payment.amount), 0);
      }
      return sum;
    }, 0);

    const overdueTenants = units.filter(unit => unit.Tenant && unit.Tenant.status === 'overdue').length;

    // Simplified monthly revenue data
    const monthlyRevenue = [
      { month: '2024-01', revenue: totalRevenue * 0.1 },
      { month: '2024-02', revenue: totalRevenue * 0.15 },
      { month: '2024-03', revenue: totalRevenue * 0.12 },
      { month: '2024-04', revenue: totalRevenue * 0.18 },
      { month: '2024-05', revenue: totalRevenue * 0.2 },
      { month: '2024-06', revenue: totalRevenue * 0.25 }
    ];

    res.json({
      apartment: {
        id: apartment.id, name: apartment.name, location: apartment.location,
        totalUnits: apartment.totalUnits, soldUnits: soldUnits.length,
        availableUnits: availableUnits.length, reservedUnits: reservedUnits.length,
        totalRevenue, overdueTenants,
        occupancyRate: Math.round(((soldUnits.length + reservedUnits.length) / apartment.totalUnits) * 100)
      },
      monthlyRevenue
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('join-apartment', (apartmentId) => {
    socket.join(`apartment-${apartmentId}`);
    console.log(`📍 User ${socket.id} joined apartment-${apartmentId}`);
  });

  socket.on('leave-apartment', (apartmentId) => {
    socket.leave(`apartment-${apartmentId}`);
    console.log(`📤 User ${socket.id} left apartment-${apartmentId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Create required directories
const createDirectories = () => {
  const dirs = ['uploads', 'reports'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

// Database initialization
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Connected Successfully');
    
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Database synchronized successfully');
    
    if (process.env.CREATE_ADMIN === 'true') {
      const adminExists = await User.findOne({ where: { role: 'admin' } });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
        await User.create({
          username: 'admin',
          email: process.env.ADMIN_EMAIL || 'admin@realestate.com',
          password: hashedPassword,
          role: 'admin'
        });
        console.log('✅ Default admin user created');
      }
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  const PORT = process.env.PORT || 5000;
  
  try {
    createDirectories();
    await initializeDatabase();
    
    server.listen(PORT, () => {
      console.log('\n🚀 ======================================');
      console.log(`🏠 Real Estate CRM Server Started`);
      console.log(`📊 Port: ${PORT}`);
      console.log(`🗄️ Database: MySQL`);
      console.log(`🔄 Real-time: WebSocket enabled`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`🔍 Health: http://localhost:${PORT}/health`);
      console.log('🚀 ======================================\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n📤 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('🔌 HTTP server closed');
    
    try {
      await sequelize.close();
      console.log('🗄️ Database connection closed');
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start the application
startServer();