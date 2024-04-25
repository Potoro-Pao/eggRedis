// app/schedule/backup.js
const Subscription = require('egg').Subscription;

class Backup extends Subscription {
  static get schedule() {
    return {
      interval: '5m', // 根据需要调整，如每小时备份一次
      type: 'all', // 指定所有的 worker 都要执行
    };
  }

  async subscribe() {
    await this.ctx.app.redis.bgsave();
    console.log(':))))))))))))))))))))))))))))))))))))))))))))))))))))))))))');
  }
}

module.exports = Backup;
