import type { Express, Request } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { adminDb, verifyFirebaseToken } from "./firebase-admin.js";
import { FieldValue } from 'firebase-admin/firestore';
import { registerUserRoutes } from "./routes/users.js";
import { registerClubRoutes } from "./routes/clubs.js";
import { registerRankingRoutes } from "./routes/rankings.js";

// 에러 코드 상수
const ERROR_CODES = {
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED', 
  ALREADY_PROCESSED: 'ALREADY_PROCESSED',
  FORBIDDEN_NOT_PARTICIPANT: 'FORBIDDEN_NOT_PARTICIPANT',
  FORBIDDEN_NOT_OPPONENT: 'FORBIDDEN_NOT_OPPONENT',
  DUPLICATE_FRIENDSHIP: 'DUPLICATE_FRIENDSHIP',
} as const;

interface AuthenticatedRequest extends Request {
  user: {
    uid: string;
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // JSON parsing middleware for API routes
  app.use(express.json());
  
  // Users 라우트 등록
  registerUserRoutes(app);
  
  // Club 라우트 등록
  registerClubRoutes(app);
  
  // Ranking 라우트 등록
  registerRankingRoutes(app);

  // 친구 요청 API
  app.post('/api/friends/request', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { targetUserId } = req.body;
      const requesterId = req.user.uid;

      if (!targetUserId) {
        return res.status(400).json({ error: 'targetUserId가 필요합니다.' });
      }

      if (requesterId === targetUserId) {
        return res.status(400).json({ error: '자신에게 친구 요청을 보낼 수 없습니다.' });
      }

      // 정렬된 페어 키로 중복 방지
      const pairKey = [requesterId, targetUserId].sort().join(':');
      
      // 트랜잭션으로 중복 확인 및 생성
      await adminDb.runTransaction(async (transaction) => {
        const friendRef = adminDb.collection('friends').doc(pairKey);
        const existingDoc = await transaction.get(friendRef);
        
        if (existingDoc.exists) {
          throw new Error(ERROR_CODES.DUPLICATE_FRIENDSHIP);
        }

        // 친구 요청 생성
        transaction.set(friendRef, {
          userId1: requesterId, // 요청자
          userId2: targetUserId, // 수신자  
          status: 'pending' as const,
          pairKey,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      
      res.status(201).json({ 
        pairKey,
        message: '친구 요청이 전송되었습니다.' 
      });
    } catch (error: unknown) {
      console.error('친구 요청 오류:', error);
      if (error instanceof Error) {
        if (error.message === ERROR_CODES.DUPLICATE_FRIENDSHIP) {
          return res.status(409).json({ error: '이미 친구 관계가 존재합니다.' });
        }
        // Firestore 트랜잭션 충돌 처리 (GRPC 코드 기반)
        const firebaseError = error as { code?: number };
        if (firebaseError.code === 10) { // ABORTED
          return res.status(409).json({ error: '친구 요청이 이미 처리되었습니다.' });
        }
        if (firebaseError.code === 6) { // ALREADY_EXISTS
          return res.status(409).json({ error: '친구 요청이 이미 존재합니다.' });
        }
      }
      res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  });

  // 친구 수락 API
  app.post('/api/friends/accept', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { pairKey } = req.body;
      const currentUserId = req.user.uid;

      if (!pairKey) {
        return res.status(400).json({ error: 'pairKey가 필요합니다.' });
      }

      await adminDb.runTransaction(async (transaction) => {
        const friendRef = adminDb.collection('friends').doc(pairKey);
        const friendDoc = await transaction.get(friendRef);
        
        if (!friendDoc.exists) {
          throw new Error(ERROR_CODES.NOT_FOUND);
        }

        const friendship = friendDoc.data();
        if (friendship?.status !== 'pending') {
          throw new Error(ERROR_CODES.ALREADY_PROCESSED);
        }

        // 수신자만 수락 가능
        if (friendship?.userId2 !== currentUserId) {
          throw new Error(ERROR_CODES.UNAUTHORIZED);
        }

        transaction.update(friendRef, {
          status: 'accepted',
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      res.status(200).json({ message: '친구 요청이 수락되었습니다.' });
    } catch (error) {
      console.error('친구 수락 오류:', error);
      if (error instanceof Error) {
        if (error.message === ERROR_CODES.UNAUTHORIZED) {
          return res.status(403).json({ error: '이 요청을 수락할 권한이 없습니다.' });
        }
        if (error.message === ERROR_CODES.NOT_FOUND) {
          return res.status(404).json({ error: '친구 요청을 찾을 수 없습니다.' });
        }
        if (error.message === ERROR_CODES.ALREADY_PROCESSED) {
          return res.status(400).json({ error: '이미 처리된 요청입니다.' });
        }
      }
      res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  });

  // 경기 후 매너 평가 API
  app.post('/api/matches/:matchId/review', verifyFirebaseToken, async (req: any, res) => {
    try {
      const { matchId } = req.params;
      const { targetUserId, mannerScore: rawMannerScore } = req.body;
      const reviewerId = req.user.uid;

      if (!targetUserId || rawMannerScore === undefined) {
        return res.status(400).json({ 
          error: 'targetUserId, mannerScore가 필요합니다.' 
        });
      }

      // 매너 점수 숫자 검증 및 변환
      const mannerScore = Number(rawMannerScore);
      if (!Number.isFinite(mannerScore) || mannerScore < 1 || mannerScore > 5) {
        return res.status(400).json({ error: '매너 점수는 1-5 사이의 숫자여야 합니다.' });
      }

      if (reviewerId === targetUserId) {
        return res.status(400).json({ error: '자신을 평가할 수 없습니다.' });
      }

      // 트랜잭션으로 매치 검증 및 매너 점수 업데이트
      await adminDb.runTransaction(async (transaction) => {
        const matchRef = adminDb.collection('matches').doc(matchId);
        const matchDoc = await transaction.get(matchRef);
        
        if (!matchDoc.exists) {
          throw new Error(ERROR_CODES.NOT_FOUND);
        }

        const match = matchDoc.data();
        if (match?.status !== 'completed') {
          throw new Error('완료된 매치만 리뷰할 수 있습니다.');
        }

        // 현재 사용자가 이미 리뷰했는지 확인
        const isRequester = match?.requesterId === reviewerId;
        const isTarget = match?.targetId === reviewerId;
        const alreadyReviewedByUser = (isRequester && match?.reviewedByRequester) || 
                                     (isTarget && match?.reviewedByTarget);
        
        if (alreadyReviewedByUser) {
          throw new Error('이미 리뷰를 완료했습니다.');
        }

        // 매치 참가자 확인
        const isParticipant = match?.requesterId === reviewerId || match?.targetId === reviewerId;
        if (!isParticipant) {
          throw new Error(ERROR_CODES.FORBIDDEN_NOT_PARTICIPANT);
        }

        // 대상이 상대방인지 확인
        const isOpponent = (match?.requesterId === reviewerId && match?.targetId === targetUserId) ||
                          (match?.targetId === reviewerId && match?.requesterId === targetUserId);
        if (!isOpponent) {
          throw new Error(ERROR_CODES.FORBIDDEN_NOT_OPPONENT);
        }

        const userRef = adminDb.collection('users').doc(targetUserId);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) {
          throw new Error(ERROR_CODES.NOT_FOUND);
        }

        const userData = userDoc.data();
        const currentReviewsCount = userData?.mannerReviewsCount || 0;
        
        // 첫 리뷰인 경우 합계를 0으로 시작, 아니면 기존 합계 사용
        const currentScoreSum = currentReviewsCount === 0 ? 0 : (userData?.mannerScoreSum || 0);
        
        // 누적 평균 계산
        const newReviewsCount = currentReviewsCount + 1;
        const newScoreSum = currentScoreSum + mannerScore;
        const newScore = Math.round((newScoreSum / newReviewsCount) * 10) / 10;

        transaction.update(userRef, {
          mannerScore: newScore,
          mannerReviewsCount: newReviewsCount,
          mannerScoreSum: newScoreSum,
          updatedAt: FieldValue.serverTimestamp(),
        });

        // 동시성 안전한 리뷰 상태 업데이트
        const finalReviewedByRequester = isRequester ? true : (match?.reviewedByRequester || false);
        const finalReviewedByTarget = isTarget ? true : (match?.reviewedByTarget || false);
        const finalIsReviewed = finalReviewedByRequester && finalReviewedByTarget;
        
        const reviewUpdate: any = {
          reviewedByRequester: finalReviewedByRequester,
          reviewedByTarget: finalReviewedByTarget,
          isReviewed: finalIsReviewed,
          updatedAt: FieldValue.serverTimestamp(),
        };
        
        transaction.update(matchRef, reviewUpdate);
      });

      res.status(200).json({ message: '매너 평가가 완료되었습니다.' });
    } catch (error) {
      console.error('매너 평가 오류:', error);
      if (error instanceof Error) {
        if (error.message === ERROR_CODES.FORBIDDEN_NOT_PARTICIPANT) {
          return res.status(403).json({ error: '이 매치의 참가자만 리뷰할 수 있습니다.' });
        }
        if (error.message === ERROR_CODES.FORBIDDEN_NOT_OPPONENT) {
          return res.status(403).json({ error: '매치 상대방만 평가할 수 있습니다.' });
        }
        if (error.message === ERROR_CODES.NOT_FOUND) {
          return res.status(404).json({ error: '매치 또는 사용자를 찾을 수 없습니다.' });
        }
        if (error.message.includes('완료된 매치만') || 
            error.message.includes('이미 리뷰')) {
          return res.status(400).json({ error: error.message });
        }
      }
      res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  });

  // Health check endpoint with Firebase status
  app.get('/api/health', async (req, res) => {
    const health: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      firebase: {}
    };

    // Firebase 연결 상태 확인
    try {
      await adminDb.collection('_health_check').limit(1).get();
      health.firebase.firestore = 'connected';
    } catch (firestoreError) {
      health.firebase.firestore = 'error';
      health.firebase.firestoreError = (firestoreError as Error).message;
      if (process.env.NODE_ENV === 'production') {
        health.status = 'degraded';
      }
    }

    res.json(health);
  });

  // Debug endpoint for Firebase configuration
  app.get('/api/_debug/firebase', (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ error: 'Debug endpoint only available in development' });
    }

    const debug = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'not-set',
      emulators: {
        firestore: process.env.FIRESTORE_EMULATOR_HOST || null,
        auth: process.env.FIREBASE_AUTH_EMULATOR_HOST || null,
      },
      credentials: {
        serviceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
        googleCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      },
      configuration: {
        isEmulatorMode: !!(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST),
        hasCredentials: !!(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS),
      }
    };

    res.json(debug);
  });
  
  const httpServer = createServer(app);
  return httpServer;
}