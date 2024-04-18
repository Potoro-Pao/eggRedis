const Controller = require('egg').Controller;
// const { Op } = require('sequelize');
const Decimal = require('decimal.js');
class WalletController extends Controller {
  async query(sql) {
    const result = await this.app.mysql.query(sql);
    return result;
  }

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
    const pattern = 'wallet*'; // 使用模式匹配以 'wallet:' 开头的键
    const keys = await this.ctx.app.redis.keys(pattern);
    return keys;
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
      await this.ctx.render('wallets.html', { wallets, count });
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
      this.ctx.app.redis.set(`wallet${newWallet.id}`, JSON.stringify({ type, balance }));
      this.ctx.body = { success: true, wallet: newWallet };
    } catch (error) {
      this.ctx.body = { success: false, error: error.message };
    }
  }

  async syncToDatabase(walletId, balance) {
    const wallet = await this.ctx.model.Wallet.findByPk(walletId);
    if (wallet) {
      wallet.balance_after = balance;
      await wallet.save();
    }
  }

  async deposit() {
    const ids = await this.findRedisWalletKeys();

    try {
      let currentBalance = 0;
      for (const i of ids) {
        const redisData = await this.ctx.app.redis.get(i);
        const balanceFromRedis = JSON.parse(redisData).balance;
        const redisType = JSON.parse(redisData).type;

        currentBalance = redisType === 'deposit' ? currentBalance += balanceFromRedis : currentBalance -= balanceFromRedis;

        // 加總所有的balance
      }

      if (ids.length === 0) {
        // 如果 Redis 中没有，从数据库加载，并设置到 Redis
        const wallet = await this.ctx.model.Wallet.findByPk(ids.length);
        if (!wallet) {
          this.ctx.body = { success: false, error: 'Wallet not found.' };
          return;
        }
        await this.ctx.app.redis.set(ids[0], currentBalance);
      }

      // 更新余额
      await this.ctx.app.redis.set('balanceAfter', currentBalance);
      const newBalanceAfter = new Decimal(currentBalance).toFixed(2);

      // 异步同步到数据库
      this.syncToDatabase(ids.length, newBalanceAfter);

      this.ctx.body = { success: true, balanceAfter: newBalanceAfter };
    } catch (error) {
      this.ctx.body = { success: false, error: error.message };
    }
  }

  // async deposit() {
  //   const test = await this.findRedisWalletKeys();
  //   const id = await this.getCount() || 1;
  //   for (const i of test) {
  //     const depositValue = await this.ctx.app.redis.get(i);
  //     console.log(JSON.parse(depositValue));
  //   }
  //   try {
  //     const wallet = await this.ctx.model.Wallet.findByPk(id) || 1;
  //     if (!wallet) {
  //       this.ctx.body = { success: false, error: 'Wallet not found.' };
  //       return;
  //     }
  //     const previousRecord = await this.ctx.model.Wallet.findOne({
  //       where: {
  //         id: {
  //           [Op.lt]: id, // 查找 ID 小于当前 ID 的记录
  //         },
  //       },
  //       order: [[ 'id', 'DESC' ]], // 按 ID 降序排列
  //       limit: 1, // 只取一条记录
  //     });


  //     let newBalanceAfter;

  //     if (!previousRecord) {
  //       wallet.balance_after = wallet.balance;

  //     } else {
  //       if (wallet.type === 'withdraw') {
  //         const prevBalance = previousRecord ? (isNaN(previousRecord.balance_after) ? 0 : previousRecord.balance_after) : 0;
  //         newBalanceAfter = prevBalance - parseFloat(wallet.balance);
  //       }
  //       if (wallet.type === 'deposit') {
  //         const prevBalance = previousRecord.balance_after;
  //         newBalanceAfter = new Decimal(prevBalance).plus(new Decimal(wallet.balance)).toFixed(2);
  //       }

  //       wallet.balance_after = newBalanceAfter;
  //     }

  //     await wallet.save();
  //     this.ctx.body = { success: true, balanceAfter: wallet.balance_after };
  //   } catch (error) {
  //     this.ctx.body = { success: false, error: error.message };
  //   }
  // }
}

module.exports = WalletController;
