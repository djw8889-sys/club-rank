import { Express, Request, Response } from "express";
// ✅ 경로 수정 (middleware 폴더 아님)
import { verifyFirebaseToken } from "../auth.js";
import { storage } from "../storage.js";

export function registerClubRoutes(app: Express) {
  // ✅ 내 클럽 목록
  app.get(
    "/api/clubs/my-membership",
    verifyFirebaseToken,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.uid;
        const memberships = await storage.getUserClubMemberships(userId);
        const clubs = await Promise.all(
          memberships.map((m: any) => storage.getClubById(m.clubId)),
        );
        res.json(clubs.filter(Boolean));
      } catch (error) {
        console.error("❌ 내 클럽 목록 조회 오류:", error);
        res.status(500).json({ error: "클럽 데이터를 불러오지 못했습니다." });
      }
    },
  );

  // ✅ 클럽 생성
  app.post(
    "/api/clubs",
    verifyFirebaseToken,
    async (req: any, res: Response) => {
      try {
        const { name, region } = req.body;
        const ownerId = req.user.uid;
        const club = await storage.createClub({ name, region, ownerId });
        res.json(club);
      } catch (error) {
        console.error("❌ 클럽 생성 오류:", error);
        res.status(500).json({ error: "클럽 생성에 실패했습니다." });
      }
    },
  );

  // ✅ 클럽 검색
  app.get("/api/clubs/search", async (req: Request, res: Response) => {
    try {
      const q = (req.query.q as string)?.toLowerCase() || "";
      const clubs = await storage.getAllClubs();
      const results = clubs.filter((c: any) =>
        c.name.toLowerCase().includes(q),
      );
      res.json(results);
    } catch (error) {
      console.error("❌ 클럽 검색 오류:", error);
      res.status(500).json({ error: "클럽 검색에 실패했습니다." });
    }
  });

  // ✅ 클럽 가입
  app.post(
    "/api/clubs/:clubId/join",
    verifyFirebaseToken,
    async (req: any, res: Response) => {
      try {
        const { clubId } = req.params;
        const userId = req.user.uid;
        await storage.addUserToClub(userId, parseInt(clubId));
        res.json({ message: "클럽 가입 완료" });
      } catch (error) {
        console.error("❌ 클럽 가입 오류:", error);
        res.status(500).json({ error: "클럽 가입에 실패했습니다." });
      }
    },
  );

  // ✅ 클럽 탈퇴
  app.post(
    "/api/clubs/:clubId/leave",
    verifyFirebaseToken,
    async (req: any, res: Response) => {
      try {
        const { clubId } = req.params;
        const userId = req.user.uid;
        await storage.removeUserFromClub(userId, parseInt(clubId));
        res.json({ message: "클럽 탈퇴 완료" });
      } catch (error) {
        console.error("❌ 클럽 탈퇴 오류:", error);
        res.status(500).json({ error: "클럽 탈퇴에 실패했습니다." });
      }
    },
  );

  // ✅ 클럽 내 사용자 통계
  app.get(
    "/api/clubs/:clubId/user/:userId/stats",
    verifyFirebaseToken,
    async (req: any, res: Response) => {
      try {
        const { clubId, userId } = req.params;

        if (req.user.uid !== userId) {
          return res
            .status(403)
            .json({ error: "본인 데이터만 조회할 수 있습니다." });
        }

        const numericClubId = parseInt(clubId);
        if (isNaN(numericClubId)) {
          return res.status(400).json({ error: "잘못된 클럽 ID입니다." });
        }

        const membership = await storage.getUserClubMembership(
          userId,
          numericClubId,
        );
        if (!membership) {
          return res.status(404).json({ error: "클럽 멤버가 아닙니다." });
        }

        const stats = await storage.getUserStatsInClub(userId, numericClubId);
        if (!stats) {
          return res.json({
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            winRate: 0,
            points: 1000,
            message: "아직 경기 기록이 없습니다.",
          });
        }

        res.json(stats);
      } catch (error) {
        console.error("❌ 클럽 내 사용자 통계 조회 오류:", error);
        res.status(500).json({ error: "서버 오류가 발생했습니다." });
      }
    },
  );
}
