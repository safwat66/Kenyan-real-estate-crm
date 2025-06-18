module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      primaryKey: true, 
      autoIncrement: true 
    },
    amount: { 
      type: DataTypes.DECIMAL(15, 2), 
      allowNull: false,
      validate: { min: 0 }
    },
    paymentDate: { 
      type: DataTypes.DATE, 
      allowNull: false 
    },
    paymentMethod: { 
      type: DataTypes.ENUM('cash', 'bank_transfer', 'mpesa', 'cheque', 'card', 'crypto'), 
      allowNull: false 
    },
    paymentPlan: { 
      type: DataTypes.ENUM('full_payment', '3_months', '6_months', '12_months', '18_months', '24_months', '36_months'),
      defaultValue: 'full_payment'
    },
    installmentNumber: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      defaultValue: 1 
    },
    totalInstallments: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      defaultValue: 1 
    },
    balanceRemaining: { 
      type: DataTypes.DECIMAL(15, 2), 
      defaultValue: 0 
    },
    receiptNumber: { 
      type: DataTypes.STRING(50), 
      unique: true 
    },
    transactionRef: { 
      type: DataTypes.STRING(100) 
    },
    mpesaRef: { 
      type: DataTypes.STRING(50) 
    },
    notes: { 
      type: DataTypes.TEXT 
    },
    isVerified: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false 
    },
    verifiedBy: { 
      type: DataTypes.INTEGER.UNSIGNED 
    },
    dueDate: { 
      type: DataTypes.DATE 
    },
    lateFee: { 
      type: DataTypes.DECIMAL(10, 2), 
      defaultValue: 0 
    },
    tenantId: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: false
    },
    unitId: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: false
    }
  }, {
    tableName: 'payments',
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['unitId'] },
      { fields: ['paymentDate'] },
      { fields: ['paymentMethod'] },
      { fields: ['receiptNumber'] },
      { fields: ['mpesaRef'] }
    ]
  });

  return Payment;
};