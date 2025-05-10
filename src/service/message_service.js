import { EmbedBuilder } from "discord.js";
import {
  approveTransaction,
  processTransaction,
  getTransactionByMessageId,
} from "./transaction_service.js";
import { approvedEmoji } from "../constants.js";

export async function getMessageForTransactionId(client, messageId) {
  const docRef = await getTransactionByMessageId(messageId);

  if (docRef === null) {
    throw new Error(`Transaction with ${messageId} not found`);
  }

  const channelId = docRef.data().channelId;

  try {
    const channel = await client.channels.fetch(channelId);
    const msg = await channel.messages.fetch(messageId);

    return msg;
  } catch (e) {}
}

export async function updateTransactionMessage(client, messageId) {
  try {
    const msg = await getMessageForTransactionId(client, messageId);

    const txn = await getTransactionByMessageId(messageId);
    const txnData = txn.data();

    if (txnData.isApproved || txnData.isCancelled) return;

    const author = (await txnData.author.get()).data();
    const lender = (await txnData.lender.get()).data();
    const borrowers = (
      await Promise.all(txnData.borrowers.map((user) => user.get()))
    ).map((ref) => ref.data());

    const reactions = await msg.reactions.valueOf();
    const reactedUsers = await reactions.get(approvedEmoji).users.fetch();

    let approvedUsers = [];
    let pendingUsers = [];

    if (reactedUsers.values().some((user) => user.id === lender.userId)) {
      approvedUsers.push(lender.name);
    } else {
      pendingUsers.push(lender.name);
    }

    for (const borrower of borrowers) {
      if (reactedUsers.values().some((user) => user.id === borrower.userId)) {
        approvedUsers.push(borrower.name);
      } else {
        pendingUsers.push(borrower.name);
      }
    }

    approvedUsers = [...new Set(approvedUsers)];
    pendingUsers = [...new Set(pendingUsers)];

    const amountPerPerson = txnData.amount / txnData.borrowers.length;

    const embed = new EmbedBuilder()
      .setTitle(txnData.description || "Transaction Request")
      .setAuthor({ name: author.name })
      .setFields(
        { name: "Transaction ID", value: msg.id },
        {
          name: "Paid by",
          value: lender.name,
        },
        {
          name: "Paid to",
          value: borrowers.map((user) => user.name).join(", "),
        },
        {
          name: "Amount",
          value: `${txnData.amount} ${txnData.currency} (${amountPerPerson} ${txnData.currency} per person)`,
        },
        {
          name: "Approved",
          value: `${approvedUsers.length} ${
            approvedUsers.length > 0 ? "(" + approvedUsers.join(", ") + ")" : ""
          }`,
        },
        {
          name: "Pending Approval",
          value: `${pendingUsers.length} ${
            pendingUsers.length > 0 ? "(" + pendingUsers.join(", ") + ")" : ""
          }`,
        },
        { name: "Last Updated", value: new Date().toUTCString() },
      )
      .setTimestamp();

    await msg.edit({ embeds: [embed] });

    // If all users have approved, update the transaction status
    if (pendingUsers.length === 0) {
      await approveTransaction(messageId);
      msg.edit({ content: "All users have approved the transaction." });

      await processTransaction(messageId);
      msg.edit({
        content: `Transaction has been processed on ${new Date().toUTCString()}`,
      });
      msg.unpin();
    }
  } catch (e) {
    console.log(e);
  }
}

export async function updateTransactionMessageForCancellation(
  client,
  messageId,
) {
  try {
    const msg = await getMessageForTransactionId(client, messageId);

    msg.edit({
      content: `Transaction has been cancelled on ${new Date().toUTCString()}`,
    });
    msg.unpin();
  } catch (e) {
    console.log(e);
  }
}
