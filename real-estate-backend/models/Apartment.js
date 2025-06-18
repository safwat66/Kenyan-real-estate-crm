module.exports = (sequelize, DataTypes) => {
  const Apartment = sequelize.define('Apartment', {
    id: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      primaryKey: true, 
      autoIncrement: true 
    },
    name: { 
      type: DataTypes.STRING(100), 
      allowNull: false 
    },
    location: { 
      type: DataTypes.STRING(200), 
      allowNull: false 
    },
    totalUnits: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: false,
      validate: { min: 1 }
    },
    floors: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: false,
      validate: { min: 1 }
    },
    unitsPerFloor: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: false,
      validate: { min: 1 }
    },
    imageUrl: { 
      type: DataTypes.STRING(500) 
    },
    description: { 
      type: DataTypes.TEXT 
    },
    priceRange: { 
      type: DataTypes.STRING(100) 
    },
    amenities: { 
      type: DataTypes.JSON 
    },
    userId: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: false
    },
    isActive: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: true 
    }
  }, {
    tableName: 'apartments',
    indexes: [
      { fields: ['userId'] },
      { fields: ['location'] },
      { fields: ['isActive'] }
    ]
  });

  return Apartment;
};