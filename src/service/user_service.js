import { db } from "../firebase/firebase.js";

export async function getUser(serverId, discordId) {
  const usersCollection = db.collection("users");

  const existingUser = await usersCollection
    .where("discordId", "==", discordId)
    .where("serverId", "==", serverId)
    .get();

  if (existingUser.empty) return null;

  return existingUser.docs[0];
}

export async function isActiveUser(serverId, discordId) {
  const user = await getUser(serverId, discordId);

  return user !== null && user.data().active;
}

export async function activateUser(serverId, discordId, name) {
  try {
    const user = await getUser(serverId, discordId);

    if (user !== null) {
      user.ref.update({
        serverId: serverId,
        discordId: discordId,
        name: name || discordId,
        active: true,
      });
    } else {
      const docRef = await db.collection("users").add({
        serverId: serverId,
        discordId: discordId,
        name: name || discordId,
        active: true,
      });
    }
  } catch (e) {
    console.log(e);
    throw new Error("Error when activating user");
  }
}
