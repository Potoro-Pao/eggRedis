const Service = require('egg').Service;

class WalletService extends Service {

  async countAllWallets() {
    this.ctx.app.redis.set('oo', 'spinich');
    // const a = await this.ctx.app.redis.get('oo');
    // console.log('vvvvvvvvvvvvvvvvv', a);
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
    return this.ctx.model.Wallet.findAll();
  }
}

module.exports = WalletService;
