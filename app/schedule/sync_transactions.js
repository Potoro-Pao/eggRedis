// app/schedule/sync_transactions.js
module.exports = {
  schedule: {
    interval: '1m', // This task runs every minute
    type: 'all', // This task will be executed on all workers
  },
  async task(ctx) {
    console.log('Running scheduled task to sync transactions.');
    const batchSize = 1000; // Define the maximum number of transactions per batch
    let transactionJson;
    let backUpJson;

    // Backup current transactions list before processing
    const transactionsList = await ctx.app.redis.lrange('transactions', 0, -1);
    const backUpBalanceList = await ctx.app.redis.lrange('backUpBalances', 0, -1);
    console.log(backUpBalanceList);

    // Backing up transactions
    if (transactionsList.length > 0) {
      await ctx.app.redis.rpush('transactionsBackUp', ...transactionsList);
    }

    // Clear and process transactions
    const transactions = [];
    while ((transactionJson = await ctx.app.redis.lpop('transactions'))) {
      transactions.push(JSON.parse(transactionJson));
      if (transactions.length >= batchSize) {
        await ctx.model.Wallet.bulkCreate(transactions); // Assume the model name is Transaction
        console.log(`Processed a batch of ${transactions.length} transactions.`);
        transactions.length = 0; // Clear the array after processing
      }
    }

    if (transactions.length > 0) {
      await ctx.model.Wallet.bulkCreate(transactions); // Ensure this is the correct model name
      console.log(`Processed remaining batch of ${transactions.length} transactions.`);
    }

    // Process backup balances
    const backUpBalances = [];
    while ((backUpJson = await ctx.app.redis.lpop('backUpBalances'))) {
      backUpBalances.push(JSON.parse(backUpJson));
      if (backUpBalances.length >= batchSize) {
        await ctx.model.WalletBalances.bulkCreate(backUpBalances);
        console.log(`Processed a batch of ${backUpBalances.length} backup balances.`);
        backUpBalances.length = 0; // Clear the array after processing
      }
    }

    if (backUpBalances.length > 0) {
      await ctx.model.WalletBalances.bulkCreate(backUpBalances);
      console.log(`Processed remaining batch of ${backUpBalances.length} backup balances.`);
    }
  },
};
