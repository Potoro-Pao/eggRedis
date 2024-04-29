module.exports = app => {
  const { DECIMAL, INTEGER } = app.Sequelize;

  const WalletBalances = app.model.define('walletBalances', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    balance: {
      type: DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
  }, {
    tableName: 'walletBalances',
    timestamps: false, // 确保没有自动添加时间戳字段
  });

  return WalletBalances;
};
