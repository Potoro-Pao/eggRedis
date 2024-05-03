const Controller = require('egg').Controller;

class WalletController extends Controller {
  async index() {
    try {
      const count = await this.ctx.model.Wallet.count();
      const balance = await this.ctx.app.redis.get('wallet:balance') || 0;
      const wallets = await this.ctx.service.wallet.listAll();
      await this.ctx.render('wallets.html', { wallets, count, balance });
    } catch (error) {
      this.ctx.body = { success: false, error: error.message };
    }
  }

  async create() {
    const uniqueIDsCounterKey = 'unique_transaction_counter';
    const { type, amount } = this.ctx.request.body;
    try {
      const newId = await this.ctx.app.redis.incr(uniqueIDsCounterKey);
      const balanceKey = 'wallet:balance';
      this.ctx.app.redis.watch(balanceKey);
      const multi = this.ctx.app.redis.multi();
      if (type === 'deposit') {
        multi.incrby(balanceKey, parseInt(amount));
      } else {
        multi.decrby(balanceKey, parseInt(amount));
      }
      let updatedBalance;
      const [ successPerformMulti ] = await multi.exec();
      const successPerformed = successPerformMulti[0] === null;
      const calculatedBalance = successPerformMulti[1];
      if (successPerformed) {
        if (calculatedBalance < 0) {
          await this.ctx.app.redis.incrby(balanceKey, parseInt(amount));
          updatedBalance = await this.ctx.app.redis.get(balanceKey);
          throw Error('餘額不夠');
        } else {
          updatedBalance = calculatedBalance;
        }
      }

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
}

module.exports = WalletController;
