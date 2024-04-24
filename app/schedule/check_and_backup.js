// app/schedule/check_and_backup.js
const Subscription = require('egg').Subscription;

class CheckAndBackup extends Subscription {
  static get schedule() {
    return {
      interval: '10m', // 10 分钟执行一次
      type: 'all', // 指定所有的 worker 都需要执行
    };
  }

  async subscribe() {
    const { ctx } = this;

    // 检查关键数据是否存在
    const balanceExists = await ctx.app.redis.exists('wallet:balance');
    console.log('他有存在他有存在他有存在他有存在他有存在', balanceExists);
    if (!balanceExists) {
      console.log('Critical balance data is missing, attempting to recover...');
      // 执行数据恢复逻辑
    } else {
      // 如果关键数据存在，可以选择做一次备份
      await ctx.app.redis.bgsave(); // 发起 BGSAVE 命令创建快照
      console.log('Backup created via BGSAVE.');
    }

    // 检查并备份交易列表
    const transactionsExist = await ctx.app.redis.exists('transFormer01');
    if (!transactionsExist) {
      console.log('Transaction list is missing, attempting to recover...');
      // 执行数据恢复逻辑
    }
  }
}

module.exports = CheckAndBackup;
