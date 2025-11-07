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
    console.log("\n🔍 [AUTH MIDDLEWARE] ============================================");
    console.log("🔍 [AUTH MIDDLEWARE] Request:", req.method, req.path);
    console.log("🔍 [AUTH MIDDLEWARE] Timestamp:", new Date().toISOString());
    
    const authHeader = req.headers.authorization;
    console.log("🔍 [AUTH MIDDLEWARE] Authorization header:", authHeader ? `${authHeader.substring(0, 20)}...` : "MISSING");
    
    if (!authHeader) {
      console.error("❌ [AUTH MIDDLEWARE] No Authorization header provided");
      res.status(401).json({ error: "Missing Authorization header" });
      return;
    }

    const parts = authHeader.split(" ");
    console.log("🔍 [AUTH MIDDLEWARE] Header parts:", parts.length, "- scheme:", parts[0]);
    
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      console.error("❌ [AUTH MIDDLEWARE] Invalid Authorization header format");
      res.status(401).json({ error: "Invalid Authorization header format" });
      return;
    }

    const token = parts[1];
    console.log("🔍 [AUTH MIDDLEWARE] Token extracted successfully");
    console.log("🔍 [AUTH MIDDLEWARE] Token length:", token.length);
    console.log("🔍 [AUTH MIDDLEWARE] Token preview:", token.substring(0, 30) + "...");
    
    console.log("🔍 [AUTH MIDDLEWARE] Calling verifyFirebaseToken...");
    const decoded = await verifyFirebaseToken(token);
    console.log("✅ [AUTH MIDDLEWARE] Token verified successfully!");
    console.log("✅ [AUTH MIDDLEWARE] User ID (uid):", decoded.uid);
    console.log("✅ [AUTH MIDDLEWARE] User email:", decoded.email);
    console.log("🔍 [AUTH MIDDLEWARE] ============================================\n");

    (req as any).user = decoded;
    next();
  } catch (error: any) {
    console.error("\n❌ [AUTH MIDDLEWARE] ============================================");
    console.error("❌ [AUTH MIDDLEWARE] Authentication FAILED");
    console.error("❌ [AUTH MIDDLEWARE] Error message:", error.message);
    console.error("❌ [AUTH MIDDLEWARE] Error name:", error.name);
    if (error.stack) {
      console.error("❌ [AUTH MIDDLEWARE] Stack trace:", error.stack.split('\n').slice(0, 3).join('\n'));
    }
    console.error("❌ [AUTH MIDDLEWARE] ============================================\n");
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export default admin;
