const Controller = require('egg').Controller;
const { v4: uuidv4 } = require('uuid');

class WalletController extends Controller {
  async index() {
    try {
      const count = await this.getCount();
      const total = await this.getTotal();
      const wallets = await this.ctx.service.wallet.listAll();
      await this.ctx.render('wallets.html', { wallets, total, count });
    } catch (error) {
      this.ctx.body = { success: false, error: error.message };
    }
  }

  async generateUniqueId() {
    const uniqueIDsKey = 'unique_transaction_ids';
    let newId;
    let isUnique = 0;

    while (isUnique === 0) {
      const randomPart = Math.random().toString(36).substring(2, 15);
      const timestamp = Date.now().toString();
      newId = `${timestamp}-${randomPart}`;

      // 尝试将生成的 newId 添加到 SET 中，如果已存在，则返回 0
      isUnique = await this.ctx.app.redis.sadd(uniqueIDsKey, newId);
    }

    return newId;
  }


  async create() {
    const { type, balance } = this.ctx.request.body;
    try {
      const newId = await this.generateUniqueId()
      console.log(newId)
      const balanceKey = 'wallet:balance';
      const transactionsKey = 'transactions';

      // 更新餘額
      let updatedBalance;
      if (type === 'deposit') {
        updatedBalance = await this.ctx.app.redis.incrby(balanceKey, parseInt(balance));
      } else {
        updatedBalance = await this.ctx.app.redis.decrby(balanceKey, parseInt(balance));
      }

      // 構建交易數據
      const transactionData = {
        id: newId,
        type,
        balance: parseInt(balance),
        balance_after: updatedBalance,
        create_at: new Date().toISOString(),
      };

      // 存儲交易數據
      await this.ctx.app.redis.rpush(transactionsKey, JSON.stringify(transactionData));

      this.ctx.body = { success: true, transactionId: newId };
    } catch (error) {
      console.error('Transaction failed', error);
      this.ctx.body = { success: false, error: error.message };
    }
  }

  // async create() {
  //   const { type, balance } = this.ctx.request.body;
  //   try {
  //     const balanceKey = 'wallet:balance';
  //     const transactionsKey = 'transactions';
  //     const transactionIdKey = 'transaction_id';

  //     // Redis 事务开始
  //     const multi = this.ctx.app.redis.multi();

  //     // 获取当前钱包余额
  //     const currentBalance = parseFloat(await this.ctx.app.redis.get(balanceKey) || '0');

  //     // 计算更新后的余额
  //     const amount = type === 'deposit' ? parseFloat(balance) : -parseFloat(balance);
  //     const updatedBalance = currentBalance + amount;

  //     // 队列余额更新
  //     multi.set(balanceKey, updatedBalance.toString());

  //     // 生成唯一的交易ID
  //     multi.incr(transactionIdKey);

  //     const [newTransactionId] = await multi.exec();

  //     const transactionData = {
  //       id: newTransactionId,
  //       type,
  //       balance: parseFloat(balance),
  //       balance_after: updatedBalance,
  //       created_at: new Date().toISOString(),
  //     };

  //     // 使用Hash存储交易数据
  //     await this.ctx.app.redis.hset(transactionsKey, newTransactionId, JSON.stringify(transactionData));

  //     // 使用List存储交易的顺序
  //     await this.ctx.app.redis.rpush('transactions', newTransactionId);

  //     this.ctx.body = {
  //       success: true,
  //       transactionId: newTransactionId,
  //       currentBalance: updatedBalance,
  //     };
  //   } catch (error) {
  //     console.error('Failed to create transaction:', error);
  //     this.ctx.body = {
  //       success: false,
  //       error: error.message,
  //     };
  //   }
  // }

  async getCount() {
    return this.ctx.model.Wallet.count();
  }
  async getTotal() {
    const wallets = await this.ctx.model.Wallet.findAll();
    const lastWallet = wallets.at(-1);
    return lastWallet ? lastWallet.balance_after : 0;
  }
}

module.exports = WalletController;
