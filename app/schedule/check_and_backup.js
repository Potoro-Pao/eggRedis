// app/schedule/backup.js
const Subscription = require('egg').Subscription;

class Backup extends Subscription {
  static get schedule() {
    return {
      interval: '10m',
      type: 'all',
    };
  }

  // 直接在 subscribe 方法中执行备份命令
  async subscribe() {
    try {
      await this.ctx.app.redis.bgsave();
      console.log('backUp is done');
    } catch (error) {
      console.error('Backup failed:', error);
    }
  }
}

module.exports = Backup;
