module.exports = app => {
  const { STRING, DECIMAL, ENUM, INTEGER } = app.Sequelize;

  const Wallet = app.model.define('wallet', {
    numeric_id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id: {
      type: STRING(255),
      primaryKey: false,
      autoIncrement: false,
    },
    type: {
      type: ENUM('deposit', 'withdraw'),
      allowNull: false,
    },
    balance: {
      type: DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    balance_after: {
      type: DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
  }, {
    tableName: 'wallets',
    timestamps: true,
    createdAt: 'created_at', // 明確指定 createdAt 欄位名稱
    updatedAt: false, // 禁用 updatedAt
    underscored: true,
  });


  return Wallet;
};
