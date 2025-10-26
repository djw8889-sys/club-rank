// server/firebase-admin.ts
import admin from "firebase-admin";

/**
 * ✅ Firebase Admin 초기화
 * Railway, Render, Vercel 등 환경에서도 안전하게 동작하도록
 * Firebase Service Account 키를 환경변수에서 직접 로드
 */

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!admin.apps.length) {
  if (!serviceAccountKey) {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT_KEY 환경 변수가 없습니다.");
    throw new Error("Firebase Admin 초기화 실패: 환경변수 누락");
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log(
      `✅ Firebase Admin initialized (Project ID: ${serviceAccount.project_id})`,
    );
  } catch (err) {
    console.error("❌ Firebase Admin 초기화 중 오류:", err);
    throw err;
  }
}

/**
 * ✅ Firebase Admin 인스턴스 export
 */
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();

/**
 * ✅ Firebase 인증 미들웨어
 * 요청 헤더의 Bearer 토큰을 검증해 req.user에 uid를 주입
 */
export async function verifyFirebaseToken(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "인증 토큰이 필요합니다." });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = { uid: decoded.uid };

    console.log("🟢 Firebase token verified for:", decoded.uid);
    next();
  } catch (error: any) {
    console.error("❌ Firebase token verification failed:", error.message);
    res.status(401).json({ error: "유효하지 않은 Firebase 토큰입니다." });
  }
}

export default admin;
