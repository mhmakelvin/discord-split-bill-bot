import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { firebaseConfig } from "../../config.js";
import serviceAccount from "../../serviceAccountKey.json" with { type: "json" };

let firebaseAdminApp;
let db;

if (process.env.STAGE === "prd") {
  firebaseAdminApp = initializeApp({
    projectId: firebaseConfig.projectId,
    credential: cert(serviceAccount),
  });
  db = getFirestore(firebaseAdminApp);
} else {
  firebaseAdminApp = initializeApp({
    projectId: firebaseConfig.projectId,
    credential: applicationDefault(),
  });
  db = getFirestore(firebaseAdminApp);

  if (process.env.STAGE === "local") {
    getFirestore(firebaseAdminApp).settings({
      host: "127.0.0.1:8080",
      ssl: false,
    });
    console.log("Firestore emulator connected");
  }
}

export { db };
