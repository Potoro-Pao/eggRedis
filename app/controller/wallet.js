const Controller = require('egg').Controller;
// const { Op } = require('sequelize');
// const Decimal = require('decimal.js');
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
    const pattern = 'wallet*'; // 使用模式匹配以 'wallet:' 开头的键
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
      // 生成唯一的交易 ID
      const transactionId = uuidv4();

      // 將交易資料寫入 Redis
      await this.ctx.app.redis.setex(`transaction:${transactionId}`, 3600, JSON.stringify({ type, balance }));
      await this.processTransaction();
      this.ctx.body = { success: true, transactionId };
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

  // 加入資料庫的版本
  async processTransaction() {
    // 獲取所有未處理的交易 ID
    const transactionIds = await this.ctx.app.redis.keys('transaction:*');

    // 處理一批次交易
    const batchSize = 100;
    const processedIds = [];

    for (let i = 0; i < transactionIds.length; i += batchSize) {
      const batch = transactionIds.slice(i, i + batchSize);

      try {
        // 處理這一批次交易
        await this.processBatch(batch);

        // 標記這一批次交易為已處理
        processedIds.push(...batch);
      } catch (error) {
        this.ctx.logger.error(`Error processing batch: ${error.message}`);
      }
    }

    // 從 Redis 中刪除已處理的交易
    const multi = this.ctx.app.redis.multi();
    for (const id of processedIds) {
      multi.del(id);
    }
    await multi.exec();
  }

  async processBatch(transactionIds) {
    const transactions = [];

    for (const id of transactionIds) {
      const transaction = await this.ctx.app.redis.get(id);
      const { type, balance } = JSON.parse(transaction);

      transactions.push({
        type,
        balance,
        balance_after: 0, // 初始化為 0,後續會更新
      });
    }

    // 批量創建交易記錄
    const wallets = await this.ctx.model.Wallet.bulkCreate(transactions);
    console.log('青江菜空心菜', wallets);

    // 更新餘額
    let totalBalance = 0;
    for (const wallet of wallets) {
      if (wallet.type === 'deposit') {
        totalBalance += wallet.balance;
      } else {
        totalBalance -= wallet.balance;
      }

      wallet.balance_after = totalBalance;
      await wallet.save();
    }

  }


  // 只與資料庫互動的版本
  // async processTransaction() {
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
