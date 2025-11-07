import admin, { verifyFirebaseToken as verifyToken, adminDb } from "./firebase-admin.js";
import { Request, Response, NextFunction } from "express";

// Re-export for backwards compatibility
export { adminDb };

/**
 * ✅ Firebase 토큰 검증 함수
 * @param token Firebase ID 토큰 문자열
 */
export async function verifyFirebaseToken(token: string): Promise<any> {
  return verifyToken(token);
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
    console.log("🔍 [AUTH DEBUG] authenticateUser called for:", req.method, req.path);
    const authHeader = req.headers.authorization;
    console.log("🔍 [AUTH DEBUG] Authorization header exists:", !!authHeader);
    
    if (!authHeader) {
      console.error("❌ [AUTH DEBUG] Missing Authorization header");
      res.status(401).json({ error: "Missing Authorization header" });
      return;
    }

    const token = authHeader.split(" ")[1];
    console.log("🔍 [AUTH DEBUG] Token extracted, length:", token?.length || 0);
    
    console.log("🔍 [AUTH DEBUG] Verifying Firebase token...");
    const decoded = await verifyFirebaseToken(token);
    console.log("✅ [AUTH DEBUG] Token verified, uid:", decoded?.uid);

    (req as any).user = decoded; // req.user에 저장
    next();
  } catch (error: any) {
    console.error("❌ [AUTH DEBUG] Auth middleware error:", error.message);
    console.error("❌ [AUTH DEBUG] Error stack:", error.stack);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export default admin;
