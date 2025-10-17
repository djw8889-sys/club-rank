// server/firebase-admin.ts
import admin from "firebase-admin";

// ✅ Railway 환경변수에서 Firebase Service Account JSON 읽기
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!admin.apps.length) {
  if (!serviceAccountKey) {
    console.error(
      "❌ FIREBASE_SERVICE_ACCOUNT_KEY 환경 변수가 설정되지 않았습니다.",
    );
    throw new Error("Firebase Admin 초기화 실패: 서비스 계정 키 누락");
  }

  try {
    // JSON 문자열 → 객체 변환
    const serviceAccount = JSON.parse(serviceAccountKey);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log(
      "✅ Firebase Admin initialized successfully (Project ID:",
      serviceAccount.project_id,
      ")",
    );
  } catch (error) {
    console.error("❌ Firebase Admin 초기화 중 오류 발생:", error);
    throw error;
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();

// ✅ Firebase 인증 미들웨어
export async function verifyFirebaseToken(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "인증 토큰이 필요합니다." });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = { uid: decodedToken.uid };

    console.log("🟢 Firebase token verified for user:", decodedToken.uid);
    next();
  } catch (error: any) {
    console.error("❌ Firebase token verification failed:", error.message);
    return res
      .status(401)
      .json({ error: "유효하지 않은 Firebase 토큰입니다." });
  }
}

export default admin;
