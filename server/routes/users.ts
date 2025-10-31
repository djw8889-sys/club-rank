import type { Express, Request, Response, NextFunction } from "express";
import admin, { adminDb, verifyFirebaseToken } from "../firebase-admin.js";

/** ✅ Firebase에서 반환되는 사용자 정보 타입 */
interface DecodedIdToken {
  uid: string;
  email?: string;
  name?: string;
}

/** ✅ Express Request 확장 */
interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

/** ✅ Firebase 토큰 검증 미들웨어 */
const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verifyFirebaseToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export function registerUserRoutes(app: Express): void {
  /**
   * ✅ 실시간 접속중인 사용자 목록 조회 API
   */
  app.get(
    "/api/users/online",
    authenticateUser,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const currentUserId = req.user?.uid;
        if (!currentUserId) {
          return res.status(401).json({ error: "인증 정보가 없습니다." });
        }

        // Firebase Realtime Database에서 모든 사용자 상태 조회
        const realtimeDb = admin.database();
        const statusRef = realtimeDb.ref("/status");
        const statusSnapshot = await statusRef.once("value");
        const statusData = statusSnapshot.val();

        if (!statusData) {
          return res.status(200).json({
            users: [],
            message: "현재 접속 중인 사용자가 없습니다.",
          });
        }

        // isOnline: true인 사용자들의 ID 목록 추출 (본인 제외)
        const onlineUserIds: string[] = [];
        Object.keys(statusData).forEach((userId) => {
          const userStatus = statusData[userId];
          if (userStatus.isOnline && userId !== currentUserId) {
            onlineUserIds.push(userId);
          }
        });

        if (onlineUserIds.length === 0) {
          return res.status(200).json({
            users: [],
            message: "현재 접속 중인 다른 사용자가 없습니다.",
          });
        }

        // Firestore에서 온라인 사용자 프로필 조회
        const userProfiles: any[] = [];
        for (const userId of onlineUserIds) {
          try {
            const userDoc = await adminDb.collection("users").doc(userId).get();
            if (userDoc.exists) {
              const userData = userDoc.data();
              if (userData) {
                userProfiles.push({
                  id: userId,
                  username: userData.username || "익명",
                  photoURL: userData.photoURL || null,
                  ntrp: userData.ntrp || "미설정",
                  region: userData.region || "미설정",
                  mannerScore: userData.mannerScore ?? 5,
                  wins: userData.wins || 0,
                  losses: userData.losses || 0,
                  points: userData.points || 0,
                  bio: userData.bio || null,
                  tier: userData.tier || null,
                  age: userData.age || "미설정",
                  availableTimes: userData.availableTimes || [],
                  isOnline: true,
                  lastChanged: statusData[userId].lastChanged || null,
                });
              }
            }
          } catch (userError) {
            console.error(`사용자 ${userId} 프로필 조회 오류:`, userError);
          }
        }

        res.status(200).json({
          users: userProfiles,
          count: userProfiles.length,
          message: `현재 ${userProfiles.length}명이 접속 중입니다.`,
        });
      } catch (error) {
        console.error("온라인 사용자 목록 조회 오류:", error);
        res.status(500).json({ error: "서버 오류가 발생했습니다." });
      }
    },
  );

  /**
   * ✅ 특정 사용자의 공개 프로필 조회 API
   */
  app.get(
    "/api/users/:userId",
    authenticateUser,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { userId } = req.params;
        const currentUserId = req.user?.uid;

        if (!userId) {
          return res.status(400).json({ error: "userId가 필요합니다." });
        }

        // Firestore에서 사용자 정보 조회
        const userDoc = await adminDb.collection("users").doc(userId).get();

        if (!userDoc.exists) {
          return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
        }

        const userData = userDoc.data();
        if (!userData) {
          return res.status(404).json({ error: "사용자 데이터가 없습니다." });
        }

        // 공개 가능한 정보만 반환
        const publicProfile = {
          id: userId,
          username: userData.username || "익명",
          photoURL: userData.photoURL || null,
          ntrp: userData.ntrp || "미설정",
          region: userData.region || "미설정",
          mannerScore: userData.mannerScore || 5,
          wins: userData.wins || 0,
          losses: userData.losses || 0,
          points: userData.points || 0,
          bio: userData.bio || null,
          tier: userData.tier || null,
        };

        const isOwnProfile = currentUserId === userId;

        res.status(200).json({
          profile: publicProfile,
          isOwnProfile,
          message: "프로필 정보를 성공적으로 조회했습니다.",
        });
      } catch (error) {
        console.error("사용자 프로필 조회 오류:", error);
        res.status(500).json({ error: "서버 오류가 발생했습니다." });
      }
    },
  );
}
