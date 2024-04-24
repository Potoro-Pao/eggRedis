const Controller = require('egg').Controller;
// const { v4: uuidv4 } = require('uuid');
// let score = 0;
class WalletController extends Controller {
  // 获取钱包列表和数量的方法
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
      const timestamp = new Date().getTime();
      const randomNum = Math.floor(Math.random() * 10000);
      const transactionId = `${timestamp}:${randomNum}`; // 唯一id
      const balanceKey = 'wallet:balance';
      const transactionsKey = 'transactions';
      const amount = type === 'deposit' ? balance : -balance;

      const updatedBalance = await this.ctx.app.redis.incrbyfloat(balanceKey, amount);
      console.log('Check balance updated correctly', updatedBalance);

      const transactionData = {
        id: transactionId,
        type,
        balance: parseFloat(balance),
        balance_after: updatedBalance,
        created_at: new Date().toISOString(),
      };
      // console.log('Transaction Data:', transactionData);

      const transactionString = JSON.stringify(transactionData);
      const score = new Date().getTime();

      // 使用 ZADD 命令配合 NX 选项添加交易数据到有序集合
      const added = await this.ctx.app.redis.zadd(transactionsKey, 'NX', score, transactionString);

      if (added !== 1) {
        throw new Error('Transaction could not be added.');
      }

      this.ctx.body = { success: true, transactionId, currentBalance: updatedBalance };
    } catch (error) {
      console.error('Failed to create transaction:', error);
      this.ctx.body = { success: false, error: error.message };
    }
  }

  // 获取钱包数量的方法
  async getCount() {
    return this.ctx.model.Wallet.count();
  }
}

module.exports = WalletController;
