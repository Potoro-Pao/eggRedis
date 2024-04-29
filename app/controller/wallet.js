const Controller = require('egg').Controller;

class WalletController extends Controller {
  constructor(ctx) {
    super(ctx);
    this.transactionCounter = 0;
    this.transactionBuffer = [];
    this.syncInterval = setInterval(() => this.syncToCluster(), 60000); // 每分钟同步一次
  }

  async generateUniqueId() {
    const uniqueIDsCounterKey = 'unique_transaction_counter';
    const uniqueId = await this.ctx.app.redis.get('redisSingle').incr(uniqueIDsCounterKey);
    console.log('s;dfks;ldfks;f;lds', uniqueId);
    return uniqueId;
  }

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

  async getCount() {
    return this.ctx.model.Wallet.count();
  }
  async getTotal() {
    const lastWallet = await this.ctx.model.WalletBalances.findOne({
      order: [[ 'id', 'DESC' ]],
    });
    return lastWallet ? lastWallet.balance : 0; // 确保这里使用的字段名是 'balance' 而不是 'balance_after'
  }

  async create() {
    const { type, amount } = this.ctx.request.body;
    try {
      const newId = await this.generateUniqueId();
      const balanceKey = 'wallet:balance';
      const transactionsKey = 'transactions';

      let updatedBalance;
      if (type === 'deposit') {
        updatedBalance = await this.app.redis.get('redisSingle').incrby(balanceKey, parseInt(amount));
      } else {
        updatedBalance = await this.app.redis.get('redisSingle').decrby(balanceKey, parseInt(amount));
      }

      const transactionData = {
        id: newId,
        type,
        amount: parseInt(amount),
        balance_after: updatedBalance,
        create_at: new Date().toISOString(),
      };

      this.transactionBuffer.push(transactionData);
      this.transactionCounter++;

      if (this.transactionCounter >= 100) {
        await this.syncToCluster();
      }

      // Store transaction data in the primary Redis
      await this.app.redis.get('redisSingle').rpush(transactionsKey, JSON.stringify(transactionData));

      // Return success response
      this.ctx.body = { success: true, transactionId: newId };
    } catch (error) {
      console.error('Transaction failed', error);
      this.ctx.body = { success: false, error: error.message };
    }
  }

  async syncToCluster() {
    if (this.transactionBuffer.length > 0) {
      const transactionsKey = 'transactions';
      const transactionData = this.transactionBuffer.map(t => JSON.stringify(t));
      await this.app.redis.get('cluster').rpush(transactionsKey, ...transactionData);
      this.transactionCounter = 0;
      this.transactionBuffer = [];
    }
  }

  // Cleanup on controller destruction
  destructor() {
    clearInterval(this.syncInterval);
  }
}

module.exports = WalletController;

