import admin from "./firebase-admin.js";
import { Request, Response, NextFunction } from "express";

// ✅ Firebase Admin 초기화
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

/**
 * ✅ Firebase 토큰 검증 함수
 * @param token Firebase ID 토큰 문자열
 */
export async function verifyFirebaseToken(token: string): Promise<any> {
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded;
  } catch (error) {
    console.error("❌ Invalid Firebase token:", error);
    throw new Error("Unauthorized");
  }
}

/**
 * ✅ Express 인증 미들웨어
 */
export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: "Missing Authorization header" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verifyFirebaseToken(token);

    (req as any).user = decoded; // req.user에 저장
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export default admin;
