// app/router.js

module.exports = app => {
  const { router, controller } = app;

  // 主页路由
  router.get('/', controller.home.index);

  // 获取单个钱包的详细信息
  router.get('/wallet/:walletId', controller.wallet.show);

  // 创建一个新的钱包记录
  router.post('/wallets', controller.wallet.create); // 用于创建钱包，并依赖数据库的 autoIncrement

  // 对现有钱包进行存款操作
  router.patch('/wallets/:walletId', controller.wallet.deposit); // 使用PATCH表示资源部分更新

  // 获取所有钱包的列表
  router.get('/wallets', controller.wallet.index);
};

