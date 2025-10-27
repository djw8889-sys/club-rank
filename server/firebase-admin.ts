import admin from "firebase-admin";

// ✅ initialize Firebase admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminDb = admin.firestore();

// ✅ verify token helper
export const verifyFirebaseToken = async (token: string) => {
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded;
  } catch (error) {
    console.error("Invalid Firebase token:", error);
    throw new Error("Unauthorized");
  }
};

export default admin;
