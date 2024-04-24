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

  async create() {
    const { type, balance } = this.ctx.request.body;
    try {
        const newId = uuidv4();
        const multi = this.ctx.app.redis.multi();

        // 新增交易時就會看他是否為唯一的key
        multi.sadd('unique_transaction_ids', newId);

        const balanceKey = 'wallet:balance';

        // 直接使用incrby更新
        if (type === 'deposit') {
            multi.incrby(balanceKey, parseInt(balance));  // 增加余额
        } else {
            multi.decrby(balanceKey, parseInt(balance));  // 减少余额
        }

        // 一次執行上述列隊
        const results = await multi.exec();
        console.log("results", results)
        const isUnique = results[0][1];  // 上述的的列隊會存在一個陣列裡面['null', 1]代表執行成功1代表示sadd他成功的加入當前這筆交易的id
        if (isUnique === 0) {
            throw new Error('Duplicate transaction ID generated');
        }

        const updatedBalance = results[1][1];  // 上述的的列隊會存在一個陣列裡面['null', 計算結果]把計算結果寫入updateBalance準備寫入資料庫

        const transactionData = {
            id: newId,
            type,
            balance: parseInt(balance),
            balance_after: updatedBalance,
            create_at: new Date().toISOString(),
        };

        // 將資料從右邊推入key值將會在schedule用lpop取出
        await this.ctx.app.redis.rpush('transactions', JSON.stringify(transactionData));

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
