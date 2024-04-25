// app/schedule/backup.js
const Subscription = require('egg').Subscription;

class Backup extends Subscription {
  static get schedule() {
    return {
      interval: '2m',
      type: 'all',
    };
  }

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
