const Service = require('egg').Service;

class WalletService extends Service {

  async countAllWallets() {
    const count = await this.ctx.model.Wallet.count();
    return count;
  }


  async create(type, initialBalance) {
    const newWallet = await this.ctx.model.Wallet.create({
      type,
      balance: initialBalance || 0, // 提供默認值為0,如果沒有初始餘額傳入
      create_at: new Date(),
    });

    return newWallet;
  }

  async listAll() {
    const record = await this.ctx.model.Wallet.findAll({
      order: [[ 'created_at', 'ASC' ]],
    });
    return record;
  }
}

module.exports = WalletService;
