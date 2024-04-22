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

    // Pop transactions from a Redis list
    console.log(`Starting batch processing. Initial queue size: ${await ctx.app.redis.llen('transactions')}`);
    while ((transactionJson = await ctx.app.redis.lpop('transactions'))) {
      console.log(`Starting batch processing. Initial queue size: ${await ctx.app.redis.llen('transactions')}`);
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
