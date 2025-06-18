module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define('Tenant', {
    id: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      primaryKey: true, 
      autoIncrement: true 
    },
    name: { 
      type: DataTypes.STRING(100), 
      allowNull: false 
    },
    email: { 
      type: DataTypes.STRING(100), 
      allowNull: false,
      validate: { isEmail: true }
    },
    phone: { 
      type: DataTypes.STRING(20), 
      allowNull: false 
    },
    idNumber: { 
      type: DataTypes.STRING(20), 
      unique: true 
    },
    occupation: { 
      type: DataTypes.STRING(100) 
    },
    emergencyContact: { 
      type: DataTypes.STRING(100) 
    },
    monthlyIncome: { 
      type: DataTypes.DECIMAL(12, 2) 
    },
    status: { 
      type: DataTypes.ENUM('prospect', 'current', 'installment', 'overdue', 'completed', 'terminated'), 
      defaultValue: 'prospect' 
    },
    joinDate: { 
      type: DataTypes.DATE, 
      defaultValue: DataTypes.NOW 
    },
    moveInDate: { 
      type: DataTypes.DATE 
    },
    unitId: { 
      type: DataTypes.INTEGER.UNSIGNED 
    },
    notes: { 
      type: DataTypes.TEXT 
    },
    lastContactDate: { 
      type: DataTypes.DATE 
    }
  }, {
    tableName: 'tenants',
    indexes: [
      { fields: ['unitId'] },
      { fields: ['status'] },
      { fields: ['email'] },
      { fields: ['phone'] },
      { fields: ['idNumber'] }
    ]
  });

  return Tenant;
};