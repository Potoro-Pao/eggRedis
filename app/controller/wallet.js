const Controller = require('egg').Controller;

class WalletController extends Controller {
  async index() {
    try {
      const count = await this.getCount();
      const total = await this.getTotal();
      const wallets = await this.ctx.service.wallet.listAll();
      await this.ctx.render('wallets.html', { wallets, total, count });
    } catch (error) {
      this.ctx.body = { success: false, error: error.message };
    }
  }

  async generateUniqueId() {
    const uniqueIDsCounterKey = 'unique_transaction_counter'; // 用于递增计数
    const uniqueIDsSetKey = 'unique_ids_set'; // 新的键名用于存储唯一ID的集合
    let newId;
    let isUnique = 0;

    while (isUnique === 0) {
      const randomPart = await this.ctx.app.redis.incr(uniqueIDsCounterKey);
      const timestamp = Date.now().toString();
      newId = `${timestamp}-${randomPart}`;
      isUnique = await this.ctx.app.redis.sadd(uniqueIDsSetKey, newId);
    }

    return newId;
  }


  async create() {
    const { type, balance } = this.ctx.request.body;
    try {
      const newId = await this.generateUniqueId();
      const balanceKey = 'wallet:balance';
      const transactionsKey = 'transactions';

      let updatedBalance;
      if (type === 'deposit') {
        updatedBalance = await this.ctx.app.redis.incrby(balanceKey, parseInt(balance));
      } else {
        updatedBalance = await this.ctx.app.redis.decrby(balanceKey, parseInt(balance));
      }

      const transactionData = {
        id: newId,
        type,
        balance: parseInt(balance),
        balance_after: updatedBalance,
        create_at: new Date().toISOString(),
      };

      // 存儲交易數據
      await this.ctx.app.redis.rpush(transactionsKey, JSON.stringify(transactionData));

      this.ctx.body = { success: true, transactionId: newId };
    } catch (error) {
      console.error('Transaction failed', error);
      this.ctx.body = { success: false, error: error.message };
    }
  }

  async getCount() {
    return this.ctx.model.Wallet.count();
  }
  async getTotal() {
    const wallets = await this.ctx.model.Wallet.findAll();
    const lastWallet = wallets.at(-1);
    return lastWallet ? lastWallet.balance_after : 0;
  }
}

module.exports = WalletController;
