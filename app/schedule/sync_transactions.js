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

    // Backup current transactions list before processing
    const transactionsList = await ctx.app.redis.lrange('transactions', 0, -1);
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
      if (transactions.length === 0) {
        const lastBalance = await ctx.app.redis.get('wallet:balance');
        const hasData = await ctx.model.WalletBalances.count();
        if (hasData) {
          await ctx.model.WalletBalances.update(
            { balance: lastBalance },
            { where: { id: 1 } }
          );
        } else {
          await ctx.model.WalletBalances.upsert({ balance: lastBalance });
        }
      }
    }

    if (transactions.length > 0) {
      await ctx.model.Wallet.bulkCreate(transactions); // Ensure this is the correct model name
      const lastBalance = await ctx.app.redis.get('wallet:balance');
      const hasData = await ctx.model.WalletBalances.count();
      if (hasData) {
        await ctx.model.WalletBalances.update(
          { balance: lastBalance },
          { where: { id: 1 } }
        );
      } else {
        await ctx.model.WalletBalances.upsert({ balance: lastBalance });
      }
      console.log(`Processed remaining batch of ${transactions.length} transactions.`);
    }
  },
};
