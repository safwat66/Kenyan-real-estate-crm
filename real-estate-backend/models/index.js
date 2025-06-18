const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Import all models
const User = require('./User')(sequelize, DataTypes);
const Apartment = require('./Apartment')(sequelize, DataTypes);
const Unit = require('./Unit')(sequelize, DataTypes);
const Tenant = require('./Tenant')(sequelize, DataTypes);
const Payment = require('./Payment')(sequelize, DataTypes);
const Report = require('./Report')(sequelize, DataTypes);
const ActivityLog = require('./ActivityLog')(sequelize, DataTypes);

// Define associations
User.hasMany(Apartment, { foreignKey: 'userId', onDelete: 'CASCADE' });
Apartment.belongsTo(User, { foreignKey: 'userId' });

Apartment.hasMany(Unit, { foreignKey: 'apartmentId', onDelete: 'CASCADE' });
Unit.belongsTo(Apartment, { foreignKey: 'apartmentId' });

Unit.hasOne(Tenant, { foreignKey: 'unitId', onDelete: 'SET NULL' });
Tenant.belongsTo(Unit, { foreignKey: 'unitId' });

Tenant.hasMany(Payment, { foreignKey: 'tenantId', onDelete: 'CASCADE' });
Payment.belongsTo(Tenant, { foreignKey: 'tenantId' });

Unit.hasMany(Payment, { foreignKey: 'unitId', onDelete: 'CASCADE' });
Payment.belongsTo(Unit, { foreignKey: 'unitId' });

User.hasMany(Report, { foreignKey: 'generatedBy', onDelete: 'CASCADE' });
Report.belongsTo(User, { foreignKey: 'generatedBy' });

Apartment.hasMany(Report, { foreignKey: 'apartmentId', onDelete: 'SET NULL' });
Report.belongsTo(Apartment, { foreignKey: 'apartmentId' });

User.hasMany(ActivityLog, { foreignKey: 'userId', onDelete: 'SET NULL' });
ActivityLog.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Payment, { foreignKey: 'verifiedBy', onDelete: 'SET NULL' });
Payment.belongsTo(User, { as: 'verifier', foreignKey: 'verifiedBy' });

module.exports = {
  sequelize,
  User,
  Apartment,
  Unit,
  Tenant,
  Payment,
  Report,
  ActivityLog
};