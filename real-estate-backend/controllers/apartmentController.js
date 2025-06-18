const { Sequelize } = require('sequelize'); // Add this import
const { Apartment, Unit, Tenant, Payment } = require('../models');
const { logActivity } = require('../utils/logger');

const getApartments = async (req, res) => {
  try {
    const apartments = await Apartment.findAll({
      where: { 
        userId: req.user.userId,
        isActive: true
      },
      include: [
        {
          model: Unit,
          attributes: ['id', 'status', 'price'],
          required: false
        }
      ],
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
};

const createApartment = async (req, res) => {
  try {
    const { name, location, totalUnits, floors, unitsPerFloor, description, priceRange, amenities } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const apartment = await Apartment.create({
      name,
      location,
      totalUnits: parseInt(totalUnits),
      floors: parseInt(floors),
      unitsPerFloor: parseInt(unitsPerFloor),
      description,
      priceRange,
      amenities: amenities ? JSON.parse(amenities) : null,
      imageUrl,
      userId: req.user.userId
    });

    await logActivity('apartment_created', 'apartment', apartment.id, { name, location, totalUnits }, req.user.userId, req);
    
    // Broadcast via socket.io
    req.io.emit('apartment_created', apartment);

    res.status(201).json(apartment);
  } catch (error) {
    console.error('Create apartment error:', error);
    res.status(400).json({ error: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const { apartmentId } = req.params;
    
    // Verify apartment belongs to user
    const apartment = await Apartment.findOne({
      where: { id: apartmentId, userId: req.user.userId, isActive: true },
      include: [
        {
          model: Unit,
          include: [
            { 
              model: Tenant, 
              include: [{ 
                model: Payment, 
                order: [['paymentDate', 'DESC']] 
              }] 
            }
          ]
        }
      ]
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

    const overdueTenants = units.filter(unit => 
      unit.Tenant && unit.Tenant.status === 'overdue'
    ).length;

    // Revenue trend (last 12 months) - FIXED SYNTAX
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const monthlyRevenue = await Payment.findAll({
      where: {
        paymentDate: { [Sequelize.Op.gte]: twelveMonthsAgo }, // Correct syntax
        unitId: { [Sequelize.Op.in]: units.map(unit => unit.id) } // Correct syntax
      },
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('paymentDate'), '%Y-%m'), 'month'],
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'revenue']
      ],
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('paymentDate'), '%Y-%m')],
      order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('paymentDate'), '%Y-%m'), 'ASC']]
    });

    res.json({
      apartment: {
        id: apartment.id,
        name: apartment.name,
        location: apartment.location,
        totalUnits: apartment.totalUnits,
        soldUnits: soldUnits.length,
        availableUnits: availableUnits.length,
        reservedUnits: reservedUnits.length,
        totalRevenue,
        occupancyRate: Math.round(((soldUnits.length + reservedUnits.length) / apartment.totalUnits) * 100),
        overdueTenants
      },
      monthlyRevenue: monthlyRevenue.map(item => ({
        month: item.dataValues.month,
        revenue: parseFloat(item.dataValues.revenue)
      }))
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getApartments,
  createApartment,
  getDashboardStats
};