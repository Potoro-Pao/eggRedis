// app/schedule/sync_transactions.js
module.exports = {
  schedule: {
    interval: '1m', // This task runs every minute
    type: 'all', // This task will be executed on all workers
  },
  async task(ctx) {
    console.log('Running scheduled task to sync transactions.');
    const batchSize = 1000; // Define the maximum number of transactions per batch
    const transactions = [];
    let transactionJson;

    // Backup current transactions list before processing
    const transactionsList = await ctx.app.redis.lrange('transactions', 0, -1);
    if (transactionsList.length > 0) {
      await ctx.app.redis.rpush('transactionsBackUp', ...transactionsList);
    }

    // Process and clear transactions
    while ((transactionJson = await ctx.app.redis.lpop('transactions'))) {
      transactions.push(JSON.parse(transactionJson));
      if (transactions.length >= batchSize) {
        await ctx.model.Wallet.bulkCreate(transactions);
        console.log(`Processed a batch of ${transactions.length} transactions.`);
        transactions.length = 0; // Clear the array after processing
      }
    }

    if (transactions.length > 0) {
      await ctx.model.Wallet.bulkCreate(transactions);
      console.log(`Processed remaining batch of ${transactions.length} transactions.`);
    }
  },
};
