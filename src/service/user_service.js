import { db } from "../firebase/firebase.js";

export async function isPermittedUser(discordId) {
  const usersCollection = db.collection("users");

  const existingUser = await usersCollection
    .where("discordId", "==", discordId)
    .where("active", "==", true)
    .get();

  return !existingUser.empty;
}

export async function activateUser(discordId, name) {
  try {
    const usersCollection = db.collection("users");

    const existingUser = await usersCollection
      .where("discordId", "==", discordId)
      .get();

    if (!existingUser.empty) {
      existingUser.forEach((user) => {
        user.ref.update({
          discordId: discordId,
          name: name || discordId,
          active: true,
        });
      });
    } else {
      const docRef = await usersCollection.add({
        discordId: discordId,
        name: name || discordId,
        active: true,
      });
      console.log("Document written with ID: ", docRef.id);
    }
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}
