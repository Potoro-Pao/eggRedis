module.exports = app => {
  const { INTEGER, DECIMAL, ENUM } = app.Sequelize;

  const Wallet = app.model.define('wallet', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
  }, {
    tableName: 'wallets',
    timestamps: true,
    underscored: true,
  });

  return Wallet;
};
