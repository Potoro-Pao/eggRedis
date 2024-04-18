const Service = require('egg').Service;

class WalletService extends Service {

  async countAllWallets() {
    const count = await this.ctx.model.Wallet.count();
    return count;
  }

  async create(type, initialBalance) {
    const newWallet = await this.ctx.model.Wallet.create({
      type,
      balance: initialBalance || 0, // 提供默认值为0，如果没有初始余额传入
      create_at: new Date(),
    });
    return newWallet;
  }

  async listAll() {
    // let record = await this.ctx.app.redis.get('record');
    // if (!record) {
    //   this.ctx.app.redis.set('record', await this.ctx.model.Wallet.findAll());
    //   record = await this.ctx.model.Wallet.findAll();
    // }
    // return record;
    return await this.ctx.model.Wallet.findAll();
  }
}

module.exports = WalletService;
