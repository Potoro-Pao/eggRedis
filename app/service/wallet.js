const Service = require('egg').Service;

class WalletService extends Service {
  async countAllWallets() {
    const count = await this.ctx.model.Wallet.count();
    return count;
  }
  async deposit(amount) {
    // 在這裡添加存款邏輯
    // 例如,您可以創建一個新的 Wallet 實例,設置 type 為 'deposit'、balance 為傳入的 amount,然後保存到數據庫
    const newWallet = await this.ctx.model.Wallet.create({
      type: 'deposit',
      balance: amount,
    });

    return newWallet;
  }

  async create(type, initialBalance) {
    const newWallet = await this.ctx.model.Wallet.create({
      type,
      balance: initialBalance || 0, // 提供默认值为0，如果没有初始余额传入
      create_at: new Date(),
      updated_at: new Date(),
    });
    return newWallet;
  }


  // 显示钱包信息方法
  async show(walletId) {
    const wallet = await this.ctx.model.Wallet.findByPk(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    return wallet;
  }

  async listAll() {
    return this.ctx.model.Wallet.findAll();
  }
}

module.exports = WalletService;
