import { CronJob } from "cron";
import {
  processTransaction,
  getUnprocessApprovedTransactions,
} from "../service/transaction_service.js";

const schedule = "0 */15 * * * *";

async function processApprovedTransactions(serverId) {
  const processedTransactions = [];
  console.log(
    `[${new Date().toUTCString()}] Running cron job to process approved transactions...`,
  );
  try {
    const transactions = await getUnprocessApprovedTransactions(serverId);
    for (const txn of transactions) {
      const transaction = txn.data();
      const { messageId, userId } = transaction;

      try {
        await processTransaction(messageId, userId);
      } catch (error) {
        console.error(
          `Error processing transaction for messageId ${messageId}:`,
          error,
        );
        continue;
      }

      processedTransactions.push(messageId);
    }
  } catch (error) {
    console.error("Error processing approved transactions:", error);
  }
  console.log(
    `[${new Date().toUTCString()}] Processed transactions: ${processedTransactions}`,
  );
}

export function registerProcessApprovedTransactionsCronJob(serverId) {
  const job = new CronJob(schedule, () =>
    processApprovedTransactions(serverId),
  );

  job.start();
}
