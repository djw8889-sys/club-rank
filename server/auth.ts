// server/auth.ts
import { Request, Response, NextFunction } from "express";
import admin from "./firebase-admin.js";

// ✅ 요청 헤더의 Firebase 토큰을 검증하는 미들웨어
export async function verifyFirebaseToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error("❌ Firebase token verification failed:", error);
    return res.status(403).json({ error: "Forbidden: Invalid token" });
  }
}
