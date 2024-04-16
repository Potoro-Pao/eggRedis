const Controller = require('egg').Controller;

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

  async getCount() {
    const count = await this.service.wallet.countAllWallets();
    return count;
  }
  // 显示钱包信息
  async index() {
    try {
      const count = await this.getCount(); // 获取计数值
      const wallets = await this.ctx.service.wallet.listAll();
      console.log('不知道會顯示在哪裡', wallets);
      // this.ctx.body = { success: true, wallets };
      await this.ctx.render('wallets.html', { wallets, count });
    } catch (error) {
      this.ctx.body = { success: false, error: error.message };
    }
  }

  async show() {
    const { walletId } = this.ctx.params; // 假设 walletId 从 URL 参数传递
    try {
      const wallet = await this.ctx.service.wallet.show(walletId);
      this.ctx.body = { success: true, wallet };
    } catch (error) {
      this.ctx.body = { success: false, error: error.message };
    }
  }

  async create() {
    const { type, balance } = this.ctx.request.body; // 假设前端传来类型和初始余额
    try {
      const newWallet = await this.ctx.model.Wallet.create({
        type,
        balance: balance || 0, // 如果没有提供初始余额，就默认为0
        create_at: new Date(),
      });
      this.ctx.body = { success: true, wallet: newWallet };
    } catch (error) {
      this.ctx.body = { success: false, error: error.message };
    }
  }

  // 存款操作

  async deposit() {
    const count = await this.getCount();
    const { amount } = this.ctx.request.body;
    const walletId = count + 1;

    try {
      const wallet = await this.ctx.service.wallet.deposit(walletId, amount);
      this.ctx.body = { success: true, balance: wallet.balance };
    } catch (error) {
      console.error(error);
      this.ctx.body = { success: false, error: error.message };
    }
  }
}

module.exports = WalletController;
