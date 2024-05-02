const Controller = require('egg').Controller;

class WalletController extends Controller {
  async index() {
    try {
      const count = await this.getCount();
      const balance = await this.getTotal();
      const wallets = await this.ctx.service.wallet.listAll();
      await this.ctx.render('wallets.html', { wallets, count, balance });
    } catch (error) {
      this.ctx.body = { success: false, error: error.message };
    }
  }

  async generateUniqueId() {
    const uniqueIDsCounterKey = 'unique_transaction_counter';
    return await this.ctx.app.redis.incr(uniqueIDsCounterKey);
  }

  async create() {
    const { type, amount } = this.ctx.request.body;
    try {
      const newId = await this.generateUniqueId();
      // const updatedBalance = await this.updateBalance(type, amount);
      const balanceKey = 'wallet:balance';
      let updatedBalance;
      this.ctx.app.redis.watch(balanceKey);
      const multi = this.ctx.app.redis.multi();
      if (type === 'deposit') {
        updatedBalance = await this.ctx.app.redis.incrby(balanceKey, parseInt(amount));
      } else {
        const tempBalance = await this.ctx.app.redis.get(balanceKey);
        if ((tempBalance - amount) < 0) {
          throw Error;
        }
        updatedBalance = await this.ctx.app.redis.decrby(balanceKey, parseInt(amount));
      }
      await multi.exec();
      const transactionsKey = 'transactions';
      const transactionData = {
        id: newId,
        type,
        balance: parseInt(amount),
        balance_after: updatedBalance,
        create_at: new Date().toISOString(),
      };
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
    // const updatedBalance = await this.ctx.app.redis.get('wallet:balance') || 0;
    return await this.ctx.app.redis.get('wallet:balance') || 0;
  }
}

module.exports = WalletController;
