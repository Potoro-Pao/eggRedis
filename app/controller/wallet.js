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
    const uniqueId = await this.ctx.app.redis.incr(uniqueIDsCounterKey);
    return uniqueId;
  }

  async create() {
    const { type, amount } = this.ctx.request.body;
    try {
      const newId = await this.generateUniqueId();
      const balanceKey = 'wallet:balance';
      const transactionsKey = 'transactions';
      const balanceBackUpKey = 'backUpBalances';
      let updatedBalance;
      if (type === 'deposit') {
        updatedBalance = await this.ctx.app.redis.incrby(balanceKey, parseInt(amount));
      } else {
        updatedBalance = await this.ctx.app.redis.decrby(balanceKey, parseInt(amount));
      }

      const transactionData = {
        id: newId,
        type,
        balance: parseInt(amount),
        balance_after: updatedBalance,
        create_at: new Date().toISOString(),
      };

      const backUpBalanceData = {
        balance: updatedBalance,
      };

      // 存儲交易數據
      await this.ctx.app.redis.rpush(transactionsKey, JSON.stringify(transactionData));
      await this.ctx.app.redis.rpush(balanceBackUpKey, JSON.stringify(backUpBalanceData));
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
    const lastWallet = await this.ctx.model.WalletBalances.findOne({
      order: [[ 'id', 'DESC' ]],
    });
    return lastWallet ? lastWallet.balance : 0; // 确保这里使用的字段名是 'balance' 而不是 'balance_after'
  }

}

module.exports = WalletController;
