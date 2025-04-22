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

export async function cancelTransaction(messageId) {
  const txn = await getTransaction(messageId);

  if (txn === null) {
    throw new Error(`Transaction with ${messageId} not found`);
  }

  if (txn.data().isCancelled) {
    throw new Error(`Transaction ${messageId} is already cancelled`);
  }

  if (txn.data().isApproved) {
    throw new Error(`Transaction ${messageId} is already processed`);
  }

  docRef.update({ isCancelled: true });
}

export async function addTransaction(
  serverId,
  author,
  paidByUser,
  paidForUserList,
  amount,
  currency,
  description,
  messageId,
) {
  const inactiveUserList = [];

  const authorData = await getUser(serverId, author.username);
  if (authorData === null || authorData.data().active === false) {
    throw new Error(
      `${inactiveUserList} is not activated for Split Bill Bot in this server`,
    );
  }

  const paidByUserData = await getUser(serverId, paidByUser.username);
  if (paidByUserData === null || paidByUserData.data().active === false) {
    inactiveUserList.push(paidByUser);
  }

  const paidForUserRefList = [];
  for (const user of paidForUserList) {
    const userData = await getUser(serverId, user.username);
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

  if (txn === null) {
    throw new Error(`Transaction with ID ${messageId} not found`);
  }

  txn.ref.delete();
}
