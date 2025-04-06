import { db } from "../firebase/firebase.js";

export async function deleteTransaction(txnId) {
  const docRef = await db.collection("transactions").doc(txnId);

  if (!docRef.get().exists) {
    throw new Error(`Transaction with ${txnId} not found`);
  }

  const txn = await docRef.get();

  if (txn.data().isDeleted) {
    throw new Error(`Transaction ${txnId} is already cancelled`);
  }

  docRef.update({ isDeleted: true });
}
