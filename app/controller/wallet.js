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
    const balanceKey = 'wallet:balance';
    const transactionsKey = 'transactions';
    try {
      const newId = await this.ctx.app.redis.incr(uniqueIDsCounterKey);
      const multi = this.ctx.app.redis.multi();
      if (type === 'deposit') {
        multi.get(balanceKey).set('currentAmount', amount).get('currentAmount')
          .incrby(balanceKey, amount);
      } else {
        multi.get(balanceKey).set('currentAmount', amount).get('currentAmount')
          .decrby(balanceKey, amount);
      }

      await multi.exec(async (err, res) => {
        const fixedAmount = parseInt(res[2][1]);
        let currentBalance = parseInt(res[3][1]);
        if (currentBalance < 0) {
          currentBalance = await this.app.redis.incrby(balanceKey, fixedAmount);
        } else {
          const transactionData = {
            id: newId,
            type,
            balance: fixedAmount,
            balance_after: currentBalance,
            create_at: new Date().toISOString(),
          };
          this.ctx.app.redis.rpush(transactionsKey, JSON.stringify(transactionData));
        }
      });

      this.ctx.body = { success: true, transactionId: newId };
    } catch (error) {
      console.error('Transaction failed', error);
      this.ctx.body = { success: false, error: error.message };
    }
  }
}

module.exports = WalletController;
