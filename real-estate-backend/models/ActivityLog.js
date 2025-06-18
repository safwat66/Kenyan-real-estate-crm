module.exports = (sequelize, DataTypes) => {
  const ActivityLog = sequelize.define('ActivityLog', {
    id: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      primaryKey: true, 
      autoIncrement: true 
    },
    action: { 
      type: DataTypes.STRING(100), 
      allowNull: false 
    },
    entityType: { 
      type: DataTypes.ENUM('apartment', 'unit', 'tenant', 'payment', 'user', 'report'), 
      allowNull: false 
    },
    entityId: { 
      type: DataTypes.INTEGER.UNSIGNED 
    },
    details: { 
      type: DataTypes.JSON 
    },
    userId: { 
      type: DataTypes.INTEGER.UNSIGNED 
    },
    ipAddress: { 
      type: DataTypes.STRING(45) 
    },
    userAgent: { 
      type: DataTypes.TEXT 
    }
  }, {
    tableName: 'activity_logs',
    updatedAt: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['entityType'] },
      { fields: ['createdAt'] },
      { fields: ['action'] }
    ]
  });

  return ActivityLog;
};