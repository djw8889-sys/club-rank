import { Express, Request, Response } from "express";
import { verifyFirebaseToken } from "../auth";
import { storage } from "../storage";

export function registerClubRoutes(app: Express) {
  // ✅ 내 클럽 목록 조회
  app.get(
    "/api/clubs/my-membership",
    verifyFirebaseToken,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.uid;
        console.log("🟢 [Route] Loading memberships for:", userId);

        const memberships = await storage.getUserClubMemberships(userId);
        const clubs = await Promise.all(
          memberships.map((m: any) => storage.getClubById(m.clubId)),
        );

        const validClubs = clubs.filter(Boolean);
        console.log("✅ [Route] Loaded clubs:", validClubs.length);

        // ✅ 프론트에서 response.data.clubs 로 접근 가능하게 구조 통일
        res.status(200).json({ clubs: validClubs });
      } catch (error) {
        console.error("❌ [Route] 내 클럽 목록 조회 오류:", error);
        res
          .status(500)
          .json({ error: "클럽 데이터를 불러오는 중 오류가 발생했습니다." });
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
        const ownerId = req.user?.uid;
        if (!ownerId) {
          return res.status(401).json({ error: "인증되지 않은 사용자입니다." });
        }

        console.log("🟢 [Route] Creating club:", name, region, ownerId);
        const club = await storage.createClub({ name, region, ownerId });

        // ✅ 생성 직후 클럽 반환
        res.status(201).json({ club });
      } catch (error) {
        console.error("❌ [Route] 클럽 생성 오류:", error);
        res.status(500).json({ error: "클럽 생성에 실패했습니다." });
      }
    },
  );

  // ✅ 클럽 검색
  app.get("/api/clubs/search", async (req: Request, res: Response) => {
    try {
      const q = (req.query.q as string)?.toLowerCase() || "";
      const clubs = await storage.getAllClubs?.();

      if (!clubs) {
        return res.status(200).json({ clubs: [] });
      }

      const results = clubs.filter((c: any) =>
        c.name.toLowerCase().includes(q),
      );

      res.status(200).json({ clubs: results });
    } catch (error) {
      console.error("❌ [Route] 클럽 검색 오류:", error);
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
        console.log("🟢 [Route] User joining club:", clubId, userId);

        await storage.addUserToClub(userId, parseInt(clubId));
        res.status(200).json({ message: "클럽 가입 완료" });
      } catch (error) {
        console.error("❌ [Route] 클럽 가입 오류:", error);
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
        console.log("🟢 [Route] User leaving club:", clubId, userId);

        await storage.removeUserFromClub(userId, parseInt(clubId));
        res.status(200).json({ message: "클럽 탈퇴 완료" });
      } catch (error) {
        console.error("❌ [Route] 클럽 탈퇴 오류:", error);
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
          return res.status(200).json({
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            winRate: 0,
            points: 1000,
            message: "아직 경기 기록이 없습니다.",
          });
        }

        res.status(200).json(stats);
      } catch (error) {
        console.error("❌ [Route] 클럽 내 사용자 통계 조회 오류:", error);
        res.status(500).json({ error: "서버 오류가 발생했습니다." });
      }
    },
  );
}
