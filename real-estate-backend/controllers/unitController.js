const { Sequelize } = require('sequelize');
const { Unit, Apartment, Tenant, Payment } = require('../models');
const { logActivity } = require('../utils/logger');

const getUnits = async (req, res) => {
  try {
    const { apartmentId } = req.params;
    const { floor, status } = req.query;

    // Verify apartment belongs to user
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
          include: [
            {
              model: Payment,
              required: false,
              order: [['paymentDate', 'DESC']],
              limit: 5
            }
          ]
        }
      ],
      order: [['floor', 'ASC'], ['unitNumber', 'ASC']]
    });

    res.json(units);
  } catch (error) {
    console.error('Get units error:', error);
    res.status(500).json({ error: error.message });
  }
};

const createUnit = async (req, res) => {
  try {
    const { apartmentId } = req.params;
    const { unitNumber, floor, area, price, bedrooms, bathrooms, unitType, features } = req.body;

    // Verify apartment belongs to user
    const apartment = await Apartment.findOne({
      where: { id: apartmentId, userId: req.user.userId, isActive: true }
    });

    if (!apartment) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    const unit = await Unit.create({
      unitNumber,
      floor: parseInt(floor),
      area: parseFloat(area),
      price: parseFloat(price),
      bedrooms: parseInt(bedrooms) || 1,
      bathrooms: parseInt(bathrooms) || 1,
      unitType: unitType || '1br',
      features: features ? JSON.parse(features) : null,
      apartmentId: parseInt(apartmentId)
    });

    await logActivity('unit_created', 'unit', unit.id, { unitNumber, apartmentId, price }, req.user.userId, req);
    
    // Broadcast to apartment room
    req.io.to(`apartment-${apartmentId}`).emit('unit_created', unit);

    res.status(201).json(unit);
  } catch (error) {
    console.error('Create unit error:', error);
    res.status(400).json({ error: error.message });
  }
};

const updateUnitStatus = async (req, res) => {
  try {
    const { unitId } = req.params;
    const { status, notes } = req.body;

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

    await logActivity('unit_status_updated', 'unit', unit.id, { 
      oldStatus, 
      newStatus: status, 
      notes 
    }, req.user.userId, req);
    
    // Broadcast to apartment room
    req.io.to(`apartment-${unit.apartmentId}`).emit('unit_updated', unit);

    res.json(unit);
  } catch (error) {
    console.error('Update unit status error:', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getUnits,
  createUnit,
  updateUnitStatus
};