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
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      return null;
    }

    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    };
  } catch (error) {
    console.error("❌ Firebase service account JSON 파싱 실패:", error);
    return null;
  }
}

const serviceAccount = loadServiceAccount();

// ✅ Firebase Admin 초기화
if (serviceAccount && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
  console.log("✅ Firebase Admin initialized");
} else if (!serviceAccount) {
  console.warn("⚠️  Firebase Admin not initialized - credentials not found");
  console.warn("   Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to enable Firebase features");
}

export const adminDb = serviceAccount ? admin.firestore() : null as any;

// ✅ 토큰 검증 유틸
export const verifyFirebaseToken = async (token: string) => {
  if (!serviceAccount) {
    throw new Error("Firebase Admin not initialized - authentication unavailable");
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded;
  } catch (error) {
    console.error("❌ Invalid Firebase token:", error);
    throw new Error("Unauthorized");
  }
};

export default admin;
