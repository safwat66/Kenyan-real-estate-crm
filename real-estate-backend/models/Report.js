module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define('Report', {
    id: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      primaryKey: true, 
      autoIncrement: true 
    },
    reportType: { 
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'), 
      allowNull: false 
    },
    startDate: { 
      type: DataTypes.DATE, 
      allowNull: false 
    },
    endDate: { 
      type: DataTypes.DATE, 
      allowNull: false 
    },
    fileName: { 
      type: DataTypes.STRING(255), 
      allowNull: false 
    },
    filePath: { 
      type: DataTypes.STRING(500), 
      allowNull: false 
    },
    fileSize: { 
      type: DataTypes.INTEGER.UNSIGNED 
    },
    recordCount: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      defaultValue: 0 
    },
    generatedBy: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: false
    },
    apartmentId: { 
      type: DataTypes.INTEGER.UNSIGNED 
    },
    downloadCount: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      defaultValue: 0 
    }
  }, {
    tableName: 'reports',
    updatedAt: false,
    indexes: [
      { fields: ['generatedBy'] },
      { fields: ['apartmentId'] },
      { fields: ['reportType'] },
      { fields: ['createdAt'] }
    ]
  });

  return Report;
};