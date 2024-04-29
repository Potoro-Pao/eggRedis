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
    const backupTransactionsKey = 'backupTransactions';

    // Get the current length of the backup list
    const currentBackupLength = await ctx.app.redis.get('cluster').llen(backupTransactionsKey);

    // Copy new data to backup if any new items exist
    const newTransactions = await ctx.app.redis.get('cluster').lrange(transactionsKey, currentBackupLength, batchSize - 1);
    if (newTransactions.length > 0) {
      await ctx.app.redis.get('cluster').rpush(backupTransactionsKey, ...newTransactions);
    }

    // Process transactions from backup storage
    const transactionsList = await ctx.app.redis.get('cluster').lrange(backupTransactionsKey, 0, -1);
    if (transactionsList.length > 0) {
      const transactions = transactionsList.map(JSON.parse);
      for (const transaction of transactions) {
        await ctx.model.Wallet.upsert(transaction, {
          where: { unique_id: transaction.unique_id },
        });
      }
      console.log(`Processed ${transactions.length} transactions.`);
    }
  },
};
