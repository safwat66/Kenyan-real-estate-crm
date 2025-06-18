module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      primaryKey: true, 
      autoIncrement: true 
    },
    username: { 
      type: DataTypes.STRING(50), 
      unique: true, 
      allowNull: false,
      validate: { len: [3, 50] }
    },
    email: { 
      type: DataTypes.STRING(100), 
      unique: true, 
      allowNull: false,
      validate: { isEmail: true }
    },
    password: { 
      type: DataTypes.STRING(255), 
      allowNull: false 
    },
    role: { 
      type: DataTypes.ENUM('admin', 'salesperson', 'manager'), 
      defaultValue: 'salesperson' 
    },
    isActive: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: true 
    },
    lastLogin: { 
      type: DataTypes.DATE 
    }
  }, {
    tableName: 'users',
    indexes: [
      { fields: ['username'] },
      { fields: ['email'] },
      { fields: ['role'] }
    ]
  });

  return User;
};