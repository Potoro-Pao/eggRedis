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

      // Get current balance
      const currentBalance = parseFloat(await this.ctx.app.redis.get(balanceKey)) || 0;

      // Calculate new balance based on transaction type
      const updatedBalance = type === 'deposit' ? currentBalance + balance : currentBalance - balance;

      // Prepare transaction data
      const transactionData = {
        id: transactionId,
        type,
        balance,
        balance_after: updatedBalance,
        created_at: new Date(),
      };

      // Log the transaction data for debugging
      console.log('Transaction Data:', transactionData);

      // Execute Redis commands using MULTI/EXEC for transactional integrity
      const multi = this.ctx.app.redis.multi();
      multi.set(balanceKey, updatedBalance.toString());
      multi.lpush('transactions', JSON.stringify(transactionData));
      await multi.exec(); // Execute all commands atomically

      this.ctx.body = { success: true, transactionId, currentBalance: updatedBalance };
    } catch (error) {
      this.ctx.body = { success: false, error: error.message };
    }
  }


  async getCount() {
    return this.ctx.model.Wallet.count();
  }
}

module.exports = WalletController;
