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
    return this.ctx.model.Wallet.findAll();
  }

  // Promise {
  //   <pending>,
  //   [Symbol(async_id_symbol)]: 378,
  //   [Symbol(trigger_async_id_symbol)]: 304,
  //   [Symbol(kResourceStore)]: {
  //     request: { method: 'GET', url: '/wallets', header: [Object] },
  //     response: {
  //       status: 404,
  //       message: 'Not Found',
  //       header: [Object: null prototype]
  //     },
  //     app: {
  //       env: 'local',
  //       name: 'egg',
  //       baseDir: '/Users/angelpao/Desktop/egg',
  //       subdomainOffset: 2,
  //       config: '<egg config>',
  //       controller: '<egg controller>',
  //       httpclient: '<egg httpclient>',
  //       loggers: '<egg loggers>',
  //       middlewares: '<egg middlewares>',
  //       router: '<egg router>',
  //       serviceClasses: '<egg serviceClasses>'
  //     },
  //     originalUrl: '/wallets',
  //     req: '<original node req>',
  //     res: '<original node res>',
  //     socket: '<original node socket>'
  //   }
  // }

  // async deposit(amount) {
  //   // 在這裡添加存款邏輯
  //   // 例如,您可以創建一個新的 Wallet 實例,設置 type 為 'deposit'、balance 為傳入的 amount,然後保存到數據庫
  //   const newWallet = await this.ctx.model.Wallet.create({
  //     type: 'deposit',
  //     balance: amount,
  //   });

  //   return newWallet;
  // }

  // 显示钱包信息方法
  // async show(walletId) {
  //   const wallet = await this.ctx.model.Wallet.findByPk(walletId);
  //   if (!wallet) {
  //     throw new Error('Wallet not found');
  //   }
  //   return wallet;
  // }
}

module.exports = WalletService;
