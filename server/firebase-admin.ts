// ✅ Firebase Admin 환경변수 기반 초기화 (Circular 에러 제거 버전)
import * as admin from "firebase-admin";

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!admin.apps.length) {
  if (!serviceAccountKey) {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT_KEY 환경변수가 없습니다.");
    throw new Error("Firebase Admin 초기화 실패: 환경변수 누락");
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log(`✅ Firebase Admin 초기화 완료: ${serviceAccount.project_id}`);
  } catch (err) {
    console.error("❌ Firebase Admin 초기화 중 오류:", err);
    throw err;
  }
}

export { admin };
