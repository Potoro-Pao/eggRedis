// app/schedule/sync_transactions.js
module.exports = {
  schedule: {
    interval: '1m', // This task runs every minute
    type: 'all', // This task will be executed on all workers
  },
  async task(ctx) {
    console.log('Running scheduled task to sync transactions.');
    const batchSize = 1000; // Define the maximum number of transactions per batch
    const transactionsKey = 'transactions';
    let start = 0;
    let end = batchSize - 1;
    let transactions = [];
    let hasData = true;

    while (hasData) {
      // Retrieve a batch of transactions from the sorted set using ZRANGE
      const batch = await ctx.app.redis.zrange(transactionsKey, start, end);

      if (batch.length === 0) {
        hasData = false;
        break; // No more transactions to process
      }

      // Parse the transaction JSON strings
      transactions = batch.map(transactionJson => JSON.parse(transactionJson));

      // Write the batch to the database
      await ctx.model.Wallet.bulkCreate(transactions);
      console.log(`Processed a batch of ${transactions.length} transactions.`);

      // Remove the processed transactions from the sorted set using ZREMRANGEBYRANK
      await ctx.app.redis.zremrangebyrank(transactionsKey, start, end);

      start += batchSize;
      end += batchSize;
    }
  },
};
