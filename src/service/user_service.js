import { db } from "../firebase/firebase.js";

export async function isActiveUser(serverId, discordId) {
  const usersCollection = db.collection("users");

  const existingUser = await usersCollection
    .where("discordId", "==", discordId)
    .where("serverId", "==", serverId)
    .where("active", "==", true)
    .get();

  return !existingUser.empty;
}

export async function activateUser(serverId, discordId, name) {
  try {
    const usersCollection = db.collection("users");

    const existingUser = await usersCollection
      .where("discordId", "==", discordId)
      .where("serverId", "==", serverId)
      .get();

    if (!existingUser.empty) {
      existingUser.forEach((user) => {
        user.ref.update({
          serverId: serverId,
          discordId: discordId,
          name: name || discordId,
          active: true,
        });
      });
    } else {
      const docRef = await usersCollection.add({
        serverId: serverId,
        discordId: discordId,
        name: name || discordId,
        active: true,
      });
      console.log("Document written with ID: ", docRef.id);
    }
  } catch (e) {
    throw new Error("Error when activating user");
  }
}
