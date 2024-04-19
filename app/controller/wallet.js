const Controller = require('egg').Controller;
const { v4: uuidv4 } = require('uuid');

class WalletController extends Controller {
  async refresh() {
    try {
      const count = await this.getCount();
      const wallets = await this.ctx.service.wallet.listAll();
      await this.ctx.render('wallets.html', { wallets, count });
    } catch (error) {
      this.ctx.body = { success: false, error: error.message };
    }
  }

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
      await this.processSingleTransaction(`transaction:${transactionId}`, type, balance);
      this.ctx.body = { success: true, transactionId };
    } catch (error) {
      this.ctx.body = { success: false, error: error.message };
    }
  }

  async processTransaction(transactionId) {
    try {
      const transaction = await this.ctx.app.redis.get(`transaction:${transactionId}`);
      if (transaction) {
        const { type, balance } = JSON.parse(transaction);
        await this.processSingleTransaction(transactionId, type, balance);
        await this.ctx.app.redis.del(`transaction:${transactionId}`);
        this.ctx.body = { success: true };
      } else {
        this.ctx.body = { success: false, error: 'Transaction not found' };
      }
    } catch (error) {
      this.ctx.logger.error(`Error processing transaction ${transactionId}: ${error.message}`);
      this.ctx.body = { success: false, error: error.message };
    }
  }

  async processSingleTransaction(transactionId, type, balance) {
    console.log('jdjjfhhhhhhhhhhhhhhh', transactionId);
    // Find or create the wallet
    const wallet = await this.ctx.model.Wallet.findOne({ where: { id: transactionId } });
    if (!wallet) {
      // If no wallet exists, create a new one
      const newWallet = await this.ctx.model.Wallet.create({
        id: transactionId,
        type,
        balance,
        balance_after: balance, // Initially, balance_after is the same as balance
      });
      console.log('New wallet created:', newWallet);
    } else {
      console.log('kkkkkkkkkkkkkkkkkkkkkkkkkkk');

      // If wallet exists, update the balance
      const newBalance = type === 'deposit' ? wallet.balance_after + balance : wallet.balance_after - balance;
      wallet.balance_after = newBalance;
      await wallet.save();
      console.log('Wallet updated:', wallet);
    }
  }
}

module.exports = WalletController;
