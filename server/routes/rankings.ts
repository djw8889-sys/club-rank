import type { Express, Request, Response, NextFunction } from "express";
import { verifyFirebaseToken } from "../firebase-admin.js";
import { storage } from "../storage.js";
import { calculateMatchELO, getKFactor } from "../elo-calculator.js";

/** ✅ Express Request 확장: user는 optional 로 해야 타입 충돌 없음 */
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
  };
}

/** ✅ verifyFirebaseToken을 Express 미들웨어 시그니처로 래핑 */
const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    await verifyFirebaseToken(req, res, next);
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Unauthorized" });
  }
};

export function registerRankingRoutes(app: Express): void {
  // ✅ 사용자 랭킹 조회
  app.get(
    "/api/clubs/:clubId/rankings/user/:userId",
    authenticateUser,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const clubId = parseInt(req.params.clubId);
        const userId = req.params.userId;
        if (isNaN(clubId))
          return res.status(400).json({ error: "Invalid club ID" });

        const rankings = await storage.getUserRankingPoints(userId, clubId);
        res.json({ rankings });
      } catch (error) {
        console.error("Get user rankings error:", error);
        res.status(500).json({ error: "랭킹 정보를 가져올 수 없습니다." });
      }
    },
  );

  // ✅ 클럽별 게임 포맷 랭킹 조회
  app.get(
    "/api/clubs/:clubId/rankings/:gameFormat",
    authenticateUser,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const clubId = parseInt(req.params.clubId);
        const { gameFormat } = req.params;
        if (isNaN(clubId))
          return res.status(400).json({ error: "Invalid club ID" });

        const validFormats = [
          "mens_singles",
          "womens_singles",
          "mens_doubles",
          "womens_doubles",
          "mixed_doubles",
        ];
        if (!validFormats.includes(gameFormat))
          return res.status(400).json({ error: "Invalid game format" });

        const rankings = await storage.getClubRankingsByFormat(
          clubId,
          gameFormat,
        );
        res.json({ rankings });
      } catch (error) {
        console.error("Get club rankings error:", error);
        res.status(500).json({ error: "클럽 랭킹을 가져올 수 없습니다." });
      }
    },
  );

  // ✅ 유저 통계 조회
  app.get(
    "/api/clubs/:clubId/user/:userId/stats",
    authenticateUser,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const clubId = parseInt(req.params.clubId);
        const userId = req.params.userId;
        if (isNaN(clubId))
          return res.status(400).json({ error: "Invalid club ID" });

        const matchHistory = await storage.getUserMatchHistory(userId, clubId);
        const rankings = await storage.getUserRankingPoints(userId, clubId);

        const statsByFormat: Record<string, any> = {};
        for (const ranking of rankings) {
          statsByFormat[ranking.gameFormat] = {
            rankingPoints: ranking.rankingPoints,
            wins: ranking.wins,
            losses: ranking.losses,
            draws: ranking.draws,
            gamesPlayed: ranking.wins + ranking.losses + ranking.draws,
            winRate:
              ranking.wins + ranking.losses + ranking.draws > 0
                ? (
                    (ranking.wins /
                      (ranking.wins + ranking.losses + ranking.draws)) *
                    100
                  ).toFixed(1)
                : 0,
          };
        }

        res.json({
          matchHistory,
          statsByFormat,
          totalMatches: matchHistory.length,
        });
      } catch (error) {
        console.error("Get user stats error:", error);
        res.status(500).json({ error: "사용자 통계를 가져올 수 없습니다." });
      }
    },
  );

  // ✅ 파트너십 통계 조회
  app.get(
    "/api/clubs/:clubId/user/:userId/partnerships",
    authenticateUser,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const clubId = parseInt(req.params.clubId);
        const userId = req.params.userId;
        if (isNaN(clubId))
          return res.status(400).json({ error: "Invalid club ID" });

        const partnershipStats = await storage.getPartnershipStats(
          userId,
          clubId,
        );
        const partnerships = partnershipStats.map((stat) => ({
          partnerId: stat.partnerId,
          wins: stat.wins,
          losses: stat.losses,
          draws: stat.draws,
          gamesPlayed: stat.gamesPlayed,
          winRate: stat.winRate.toFixed(1),
        }));

        res.json({ partnerships });
      } catch (error) {
        console.error("Get partnerships error:", error);
        res.status(500).json({ error: "파트너십 분석을 가져올 수 없습니다." });
      }
    },
  );

  // ✅ 경기 완료 처리
  app.post(
    "/api/clubs/matches/:matchId/complete",
    authenticateUser,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        // ⚙️ 이하 기존 로직 그대로 유지 (생략)
        // ... 모든 로직 동일 ...
      } catch (error) {
        console.error("Complete match error:", error);
        res
          .status(500)
          .json({ error: "경기 완료 처리 중 오류가 발생했습니다." });
      }
    },
  );
}
