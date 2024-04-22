const Controller = require('egg').Controller;
const { v4: uuidv4 } = require('uuid');

class WalletController extends Controller {
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
      const balanceKey = 'wallet:balance';

      // 直接使用 Redis 的 INCRBY/DECRBY 进行原子余额更新
      const amount = type === 'deposit' ? balance : -balance;
      const updatedBalance = await this.ctx.app.redis.incrbyfloat(balanceKey, amount);

      // 准备交易数据
      const transactionData = {
        id: transactionId,
        type,
        balance,
        balance_after: updatedBalance,
        created_at: new Date(),
      };

      // Log the transaction data for debugging
      console.log('Transaction Data:', transactionData);

      // 将交易数据添加到 Redis 列表
      await this.ctx.app.redis.rpush('transactions', JSON.stringify(transactionData));

      this.ctx.body = { success: true, transactionId, currentBalance: updatedBalance };
    } catch (error) {
      console.error('Failed to create transaction:', error);
      this.ctx.body = { success: false, error: error.message };
    }
  }

  async getCount() {
    return this.ctx.model.Wallet.count();
  }
}

module.exports = WalletController;
