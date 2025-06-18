const { Sequelize } = require('sequelize');
const { Tenant, Unit, Apartment, Payment } = require('../models');
const { logActivity } = require('../utils/logger');

const getTenants = async (req, res) => {
  try {
    const { search, status, apartmentId, page = 1, limit = 50 } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};
    
    if (status && status !== 'all') whereClause.status = status;
    if (search) {
      whereClause[Sequelize.Op.or] = [
        { name: { [Sequelize.Op.like]: `%${search}%` } },
        { email: { [Sequelize.Op.like]: `%${search}%` } },
        { phone: { [Sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const includeClause = [
      {
        model: Unit,
        required: true,
        include: [{ 
          model: Apartment, 
          required: true,
          where: { userId: req.user.userId, isActive: true }
        }]
      },
      {
        model: Payment,
        required: false,
        order: [['paymentDate', 'DESC']],
        limit: 3
      }
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
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ error: error.message });
  }
};

const createTenant = async (req, res) => {
  try {
    const { 
      name, email, phone, idNumber, occupation, emergencyContact, 
      monthlyIncome, unitId, notes, moveInDate 
    } = req.body;

    // Verify unit belongs to user's apartment
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
      name,
      email,
      phone,
      idNumber,
      occupation,
      emergencyContact,
      monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
      unitId: parseInt(unitId),
      notes,
      moveInDate: moveInDate ? new Date(moveInDate) : null,
      status: 'current'
    });

    // Update unit status
    await unit.update({ status: 'sold' });

    await logActivity('tenant_created', 'tenant', tenant.id, { 
      name, unitId, unitNumber: unit.unitNumber 
    }, req.user.userId, req);
    
    // Broadcast to apartment room
    req.io.to(`apartment-${unit.apartmentId}`).emit('tenant_created', {
      tenant,
      unit: { id: unit.id, unitNumber: unit.unitNumber, apartmentId: unit.apartmentId }
    });

    res.status(201).json(tenant);
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getTenants,
  createTenant
};