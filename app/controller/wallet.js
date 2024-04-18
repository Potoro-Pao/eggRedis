const Controller = require('egg').Controller;
const { Op } = require('sequelize');
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

  async getCount() {
    const count = await this.service.wallet.countAllWallets();
    return count;
  }
  // 显示钱包信息
  async index() {
    try {
      const count = await this.getCount(); // 获取计数值
      const wallets = await this.ctx.service.wallet.listAll();
      // this.ctx.body = { success: true, wallets };
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
      this.ctx.app.redis.set(`wallet${newWallet.id}`, balance);
      this.ctx.body = { success: true, wallet: newWallet };
    } catch (error) {
      this.ctx.body = { success: false, error: error.message };
    }
  }

  async deposit() {
    const id = await this.getCount() || 1;
    try {
      const wallet = await this.ctx.model.Wallet.findByPk(id) || 1;
      if (!wallet) {
        this.ctx.body = { success: false, error: 'Wallet not found.' };
        return;
      }
      const previousRecord = await this.ctx.model.Wallet.findOne({
        where: {
          id: {
            [Op.lt]: id, // 查找 ID 小于当前 ID 的记录
          },
        },
        order: [[ 'id', 'DESC' ]], // 按 ID 降序排列
        limit: 1, // 只取一条记录
      });


      let newBalanceAfter;

      if (!previousRecord) {
        wallet.balance_after = wallet.balance;

      } else {
        if (wallet.type === 'withdraw') {
          const prevBalance = previousRecord ? (isNaN(previousRecord.balance_after) ? 0 : previousRecord.balance_after) : 0;
          newBalanceAfter = prevBalance - parseFloat(wallet.balance);
        }
        if (wallet.type === 'deposit') {
          const prevBalance = previousRecord.balance_after;
          newBalanceAfter = new Decimal(prevBalance).plus(new Decimal(wallet.balance)).toFixed(2);
        }

        wallet.balance_after = newBalanceAfter;
      }

      await wallet.save();
      this.ctx.body = { success: true, balanceAfter: wallet.balance_after };
    } catch (error) {
      this.ctx.body = { success: false, error: error.message };
    }
  }

  // 存款操作

  // async deposit() {
  //   const count = await this.getCount();
  //   const { amount } = this.ctx.request.body;
  //   const walletId = count + 1;

  //   try {
  //     const wallet = await this.ctx.service.wallet.deposit(walletId, amount);
  //     this.ctx.body = { success: true, balance: wallet.balance };
  //   } catch (error) {
  //     console.error(error);
  //     this.ctx.body = { success: false, error: error.message };
  //   }
  // }
}

module.exports = WalletController;
