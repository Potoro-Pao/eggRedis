const Controller = require('egg').Controller;
const { v4: uuidv4 } = require('uuid');

class WalletController extends Controller {
  async findRedisWalletKeys() {
    const pattern = 'wallet*';
    const keys = await this.ctx.app.redis.keys(pattern);
    return keys;
  }

  async getCount() {
    const count = await this.service.wallet.countAllWallets();
    return count;
  }

  async index() {
    try {
      const count = await this.getCount();
      const wallets = await this.ctx.service.wallet.listAll();

      await this.ctx.render('wallets.html', { wallets, count });
    } catch (error) {
      this.ctx.body = { success: false, error: error.message };
    }
  }

  async create() {
    const { type, balance } = this.ctx.request.body;
    try {
      const transactionId = uuidv4();
      await this.ctx.app.redis.setex(`transaction:${transactionId}`, 3600, JSON.stringify({ type, balance }));
      await this.processTransaction(`transaction:${transactionId}`, type, balance);
      this.ctx.body = { success: true, transactionId };
    } catch (error) {
      this.ctx.body = { success: false, error: error.message };
    }
  }

  async processTransaction(transactionId) {
    const transaction = await this.ctx.app.redis.get(transactionId);
    const { type, balance } = JSON.parse(transaction);
    const lastBalanceKey = 'lastID'; // 使用钱包ID而非交易ID

    // 获取当前余额
    let currentBalance = parseFloat(await this.ctx.app.redis.get(lastBalanceKey)) || 0;

    // 根据交易类型更新余额
    if (type === 'deposit') {
      currentBalance += balance;
    } else if (type === 'withdraw') {
      currentBalance -= balance;
    }

    // 更新 Redis 中的余额
    await this.ctx.app.redis.set(lastBalanceKey, currentBalance);
    await this.ctx.model.Wallet.create({
      id: transactionId,
      type,
      balance,
      balance_after: currentBalance,
    });
  }
}

module.exports = WalletController;
