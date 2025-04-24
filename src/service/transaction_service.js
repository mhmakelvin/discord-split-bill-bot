import { db } from "../firebase/firebase.js";
import { getUser } from "./user_service.js";

export async function getTransaction(messageId) {
  const txn = await db
    .collection("transactions")
    .where("messageId", "==", messageId)
    .get();

  if (txn.empty) {
    return null;
  }

  return txn.docs[0];
}

export async function getTransactionsPaidByUser(serverId, userId) {
  const userData = await getUser(serverId, userId);

  const txn = await db
    .collection("transactions")
    .where("lender", "==", userData.ref)
    .get();

  return txn.docs;
}

export async function getTransactionsPaidForUser(serverId, userId) {
  const userData = await getUser(serverId, userId);

  const txn = await db
    .collection("transactions")
    .where("borrowers", "array-contains", userData.ref)
    .get();

  return txn.docs;
}

export async function cancelTransaction(messageId, userId) {
  const txn = await getTransaction(messageId);

  if (txn === null) {
    throw new Error(`Transaction with ${messageId} not found`);
  }

  const author = await txn.data().author.get();
  if (author.data().id !== userId) {
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

  const inactiveUserList = [];

  const authorData = await getUser(serverId, author.id);
  if (authorData === null || authorData.data().active === false) {
    throw new Error(
      `${inactiveUserList} is not activated for Split Bill Bot in this server`,
    );
  }

  const paidByUserData = await getUser(serverId, paidByUser.id);
  if (paidByUserData === null || paidByUserData.data().active === false) {
    inactiveUserList.push(paidByUser);
  }

  const paidForUserRefList = [];
  for (const user of paidForUserList) {
    if (user === null) {
      throw new Error("Please input appropiate user for the transaction")
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
  const txn = await getTransaction(messageId);

  if (txn === null) return;

  txn.ref.delete();
}
