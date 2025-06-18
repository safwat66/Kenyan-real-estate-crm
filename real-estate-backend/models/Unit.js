module.exports = (sequelize, DataTypes) => {
  const Unit = sequelize.define('Unit', {
    id: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      primaryKey: true, 
      autoIncrement: true 
    },
    unitNumber: { 
      type: DataTypes.STRING(20), 
      allowNull: false 
    },
    floor: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: false,
      validate: { min: 1 }
    },
    area: { 
      type: DataTypes.DECIMAL(8, 2), 
      allowNull: false,
      validate: { min: 0 }
    },
    price: { 
      type: DataTypes.DECIMAL(15, 2), 
      allowNull: false,
      validate: { min: 0 }
    },
    bedrooms: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      defaultValue: 1 
    },
    bathrooms: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      defaultValue: 1 
    },
    unitType: { 
      type: DataTypes.ENUM('studio', '1br', '2br', '3br', '4br+', 'penthouse'), 
      defaultValue: '1br' 
    },
    status: { 
      type: DataTypes.ENUM('available', 'reserved', 'sold', 'installment', 'fully_paid'), 
      defaultValue: 'available' 
    },
    features: { 
      type: DataTypes.JSON 
    },
    apartmentId: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: false
    },
    reservedAt: { 
      type: DataTypes.DATE 
    },
    soldAt: { 
      type: DataTypes.DATE 
    }
  }, {
    tableName: 'units',
    indexes: [
      { fields: ['apartmentId'] },
      { fields: ['status'] },
      { fields: ['floor'] },
      { unique: true, fields: ['apartmentId', 'unitNumber'] }
    ]
  });

  return Unit;
};