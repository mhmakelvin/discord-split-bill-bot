import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { firebaseConfig } from "../../config.js";

const firebaseApp = initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);
if (process.env.STAGE === "local") {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
