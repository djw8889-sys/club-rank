import admin from "firebase-admin";

// ✅ Firebase 서비스 계정 로드 로직
function loadServiceAccount() {
  try {
    // 1️⃣ Railway에서 FIREBASE_SERVICE_ACCOUNT (JSON 전체) 사용
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

      // 🔥 여기서 줄바꿈 복원
      if (parsed.private_key && typeof parsed.private_key === "string") {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }

      return parsed;
    }

    // 2️⃣ 개별 변수로 세팅한 경우 fallback
    return {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };
  } catch (error) {
    console.error("❌ Firebase service account JSON 파싱 실패:", error);
    throw new Error("잘못된 Firebase 서비스 계정 환경변수");
  }
}

const serviceAccount = loadServiceAccount();

// ✅ Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export const adminDb = admin.firestore();

// ✅ 토큰 검증 유틸
export const verifyFirebaseToken = async (token: string) => {
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded;
  } catch (error) {
    console.error("❌ Invalid Firebase token:", error);
    throw new Error("Unauthorized");
  }
};

export default admin;
