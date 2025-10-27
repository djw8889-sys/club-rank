import { Request, Response, NextFunction } from "express";
import { verifyFirebaseToken } from "./firebase-admin";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Missing token" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = await verifyFirebaseToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Auth failed:", err);
    res.status(403).json({ message: "Invalid token" });
  }
};

// ✅ export 추가
export { verifyFirebaseToken };
