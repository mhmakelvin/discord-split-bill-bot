import { Filter } from "firebase-admin/firestore";
import { db } from "../firebase/firebase.js";
import { getUser } from "./user_service.js";

export async function getAllTransactionsByMessageId(messageId) {
  const transactions = await db
    .collection("transactions")
    .where("messageId", "==", messageId)
    .get();

  return transactions.docs;
}

export async function getTransactionByMessageId(messageId) {
  const txn = await db
    .collection("transactions")
    .where("messageId", "==", messageId)
    .get();

  if (txn.empty) {
    return null;
  }

  return txn.docs[0];
}

export async function getTransactionsByUser(serverId, userId) {
  const userData = await getUser(serverId, userId);

  if (userData === null) {
    throw new Error(`User ${userId} not found`);
  }

  const txn = await db
    .collection("transactions")
    .where("serverId", "==", serverId)
    .where(
      Filter.or(
        Filter.where("lender", "==", userData.ref),
        Filter.where("borrowers", "array-contains", userData.ref),
      ),
    )
    .get();

  return txn.docs;
}

export async function getUnprocessApprovedTransactions(serverId) {
  const approvedTransactions = await db
    .collection("transactions")
    .where("serverId", "==", serverId)
    .where("isApproved", "==", true)
    .get();

  const unprocessedTransactions = [];
  approvedTransactions.forEach((txn) => {
    if (!txn.data().isProcessed) {
      unprocessedTransactions.push(txn);
    }
  });

  return unprocessedTransactions;
}

export async function cancelTransaction(messageId, userId) {
  const txn = await getTransactionByMessageId(messageId);

  if (txn === null) {
    throw new Error(`Transaction with ${messageId} not found`);
  }

  const author = await txn.data().author.get();
  if (author.data().userId !== userId) {
    throw new Error(`Only author can cancel the transaction`);
  }

  if (txn.data().isCancelled) {
    throw new Error(`Transaction ${messageId} is already cancelled`);
  }

  if (txn.data().isApproved) {
    throw new Error(`Transaction ${messageId} is already processed`);
  }

  txn.ref.update({ isCancelled: true });
}

export async function addTransaction(
  serverId,
  author,
  paidByUser,
  paidForUserList,
  amount,
  currency,
  description,
  channelId,
  messageId,
) {
  if (amount <= 0) {
    throw new Error("Please input valid amount (Greater than 0)");
  }

  if (/^.*\<((@(&)?)|#)[0-9]+\>.*$/.test(description)) {
    throw new Error(
      "Invalid description. Please try not to use mentionable as description",
    );
  }

  const inactiveUserList = [];

  const authorData = await getUser(serverId, author.id);
  if (authorData === null || authorData.data().active === false) {
    throw new Error(
      `${inactiveUserList} is not activated for Split Bill Bot in this server`,
    );
  }

  if (paidByUser === null) {
    throw new Error("Please input appropiate user for the transaction");
  }
  const paidByUserData = await getUser(serverId, paidByUser.id);
  if (paidByUserData === null || paidByUserData.data().active === false) {
    inactiveUserList.push(paidByUser);
  }

  const paidForUserRefList = [];
  for (const user of paidForUserList) {
    if (user === null) {
      throw new Error("Please input appropiate user for the transaction");
    }

    const userData = await getUser(serverId, user.id);
    if (userData === null || userData.data().active === false) {
      inactiveUserList.push(user);
    } else {
      paidForUserRefList.push(userData.ref);
    }
  }

  if (inactiveUserList.length > 0) {
    throw new Error(
      `${inactiveUserList} is not activated for Split Bill Bot in this server`,
    );
  }
  const txnCollection = db.collection("transactions");

  try {
    const docRef = await txnCollection.add({
      serverId: serverId,
      author: authorData.ref,
      lender: paidByUserData.ref,
      borrowers: paidForUserRefList,
      amount: amount,
      currency: currency,
      description: description,
      channelId: channelId,
      messageId: messageId,
      createdAt: new Date(),
      isApproved: false,
      isCancelled: false,
    });
  } catch (e) {
    console.log(e);
    throw new Error("Error when creating transaction");
  }
}

export async function deleteTransaction(messageId) {
  const transactions = await getAllTransactionsByMessageId(messageId);

  for (const txn of transactions) {
    txn.ref.delete();
  }
}

export async function approveTransaction(messageId) {
  const transactions = await getAllTransactionsByMessageId(messageId);

  if (transactions.length === 0) {
    throw new Error(`Transaction with ${messageId} not found`);
  }

  for (const txn of transactions) {
    await txn.ref.update({ isApproved: true });
  }
}

export async function processTransaction(messageId) {
  const transactions = await getAllTransactionsByMessageId(messageId);

  if (transactions.length === 0) {
    throw new Error(`Transaction with ${messageId} not found`);
  }

  for (const txn of transactions) {
    const txnData = txn.data();

    if (txnData.isCancelled || txnData.isProcessed) return;
    if (!txnData.isApproved) return;

    await db.runTransaction(async (firestoreTxn) => {
      const lender = await firestoreTxn.get(txnData.lender);
      const borrowers = await Promise.all(
        txnData.borrowers.map((user) => firestoreTxn.get(user)),
      );

      const amountPerPerson = txnData.amount / txnData.borrowers.length;

      const balanceChangeByUserId = {};
      balanceChangeByUserId[lender.data().userId] = txnData.amount;
      for (const borrower of borrowers) {
        balanceChangeByUserId[borrower.data().userId] =
          (balanceChangeByUserId[borrower.data().userId] || 0) -
          amountPerPerson;
      }

      const lenderBalance = lender.data().balance || {};
      lenderBalance[txnData.currency] =
        (lenderBalance[txnData.currency] || 0) +
        balanceChangeByUserId[lender.data().userId];
      firestoreTxn.update(lender.ref, { balance: lenderBalance });

      for (const borrower of borrowers) {
        const borrowerBalance = borrower.data().balance || {};
        borrowerBalance[txnData.currency] =
          (borrowerBalance[txnData.currency] || 0) +
          balanceChangeByUserId[borrower.data().userId];
        firestoreTxn.update(borrower.ref, { balance: borrowerBalance });
      }

      firestoreTxn.update(txn.ref, {
        isProcessed: true,
      });
    });
  }
}
