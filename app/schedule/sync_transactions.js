// app/schedule/sync_transactions.js
module.exports = {
  schedule: {
    interval: '1m', // Run this task every 5 minutes
    type: 'all', // 'all' means this task will be executed on all workers
  },
  async task(ctx) {
    // Your task code here, e.g., sync data from Redis to MySQL
    console.log('Running scheduled task to sync transactions.');
    const transactions = [];
    let transactionJson;

    // Assuming you are popping transactions from a Redis list
    while ((transactionJson = await ctx.app.redis.lpop('transactions'))) {
      transactions.push(JSON.parse(transactionJson));
    }

    if (transactions.length > 0) {
      await ctx.model.Wallet.bulkCreate(transactions);
    }
  },
};


// app/schedule/sync_transactions.js
// module.exports = {
//     schedule: {
//       interval: '5m', // 5 分钟同步一次
//       type: 'all', // 所有的 worker 都需要执行
//     },
//     async task(ctx) {
//       const transactions = [];
//       const transactionJson = await ctx.app.redis.rpop('transactions');
//       while (transactionJson) {
//         transactions.push(JSON.parse(transactionJson));
//       }

//       // 批量插入数据库
//       await ctx.model.Transaction.bulkCreate(transactions);
//     },
//   };
