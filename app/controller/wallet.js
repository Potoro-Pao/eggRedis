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
      const updatedBalance = await this.updateBalance(type, amount);
      await this.recordTransaction(newId, type, amount, updatedBalance);
      await this.recordBalance(updatedBalance);
      this.ctx.body = { success: true, transactionId: newId };
    } catch (error) {
      console.error('Transaction failed', error);
      this.ctx.body = { success: false, error: error.message };
    }
  }

  async updateBalance(type, amount) {
    const balanceKey = 'wallet:balance';
    if (type === 'deposit') {
      return await this.ctx.app.redis.incrby(balanceKey, parseInt(amount));
    }
    return await this.ctx.app.redis.decrby(balanceKey, parseInt(amount));

  }

  async recordTransaction(id, type, amount, updatedBalance) {
    const transactionsKey = 'transactions';
    const transactionData = {
      id,
      type,
      balance: parseInt(amount),
      balance_after: updatedBalance,
      create_at: new Date().toISOString(),
    };
    await this.ctx.app.redis.rpush(transactionsKey, JSON.stringify(transactionData));
  }

  async recordBalance(balance) {
    const balanceBackUpKey = 'balance:backUp';
    const balanceData = {
      balance,
    };
    await this.ctx.app.redis.set(balanceBackUpKey, JSON.stringify(balanceData));
  }

  async getCount() {
    return this.ctx.model.Wallet.count();
  }

  async getTotal() {
    const balanceKey = 'balance:backUp';
    const updatedBalance = await this.ctx.app.redis.get(balanceKey) || 0;
    return JSON.parse(updatedBalance).balance;
  }
}

module.exports = WalletController;
