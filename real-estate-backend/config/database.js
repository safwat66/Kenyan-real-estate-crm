const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'real_estate_crm',
  process.env.DB_USER || 'crm_user', 
  process.env.DB_PASS || 'your_password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    dialectOptions: {
      // For production with SSL
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false,
      // For better performance
      acquireTimeout: 60000,
      timeout: 60000,
      // For MySQL 8.0 compatibility
      authPlugins: {
        mysql_native_password: () => () => Buffer.alloc(0)
      }
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    timezone: '+03:00' // Kenya timezone
  }
);

module.exports = sequelize;