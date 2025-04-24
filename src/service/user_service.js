import { db } from "../firebase/firebase.js";

export async function getUser(serverId, userId) {
  const usersCollection = db.collection("users");

  const existingUser = await usersCollection
    .where("userId", "==", userId)
    .where("serverId", "==", serverId)
    .get();

  if (existingUser.empty) return null;

  return existingUser.docs[0];
}

export async function isActiveUser(serverId, userId) {
  const user = await getUser(serverId, userId);

  return user !== null && user.data().active;
}

export async function activateUser(serverId, user, name) {
  try {
    const userData = await getUser(serverId, user.id);

    if (userData !== null) {
      userData.ref.update({
        serverId: serverId,
        userId: user.id,
        name: name || user.username,
        active: true,
      });
    } else {
      const docRef = await db.collection("users").add({
        serverId: serverId,
        userId: user.id,
        name: name || user.username,
        active: true,
      });
    }
  } catch (e) {
    console.log(e);
    throw new Error("Error when activating user");
  }
}
