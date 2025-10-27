import { Express, Request, Response } from "express";
import { verifyFirebaseToken } from "../auth";
import { storage } from "../storage";

/**
 * Club 관련 API 라우트 등록
 */
export function registerClubRoutes(app: Express) {
  // ✅ 내 클럽 멤버십 목록 조회
  app.get(
    "/api/clubs/my-membership",
    verifyFirebaseToken,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user?.uid;
        if (!userId) {
          return res.status(401).json({ error: "인증 정보가 없습니다." });
        }

        await storage.ensureDefaultMembership(userId);

        const memberships = await storage.getUserClubMemberships(userId);
        const clubs = await Promise.all(
          memberships.map(async (m) => ({
            membership: m,
            club: (await storage.getClubById(m.clubId))!, // ✅ string
          })),
        );

        return res.json({ items: clubs });
      } catch (error: any) {
        console.error("❌ [GET /api/clubs/my-membership] failed:", error);
        res.status(500).json({ error: "클럽정보 로드 실패" });
      }
    },
  );

  // ✅ 클럽 단건 조회
  app.get(
    "/api/clubs/:id",
    verifyFirebaseToken,
    async (req: Request, res: Response) => {
      try {
        const id = req.params.id; // ✅ 문자열 그대로 사용
        const club = await storage.getClubById(id); // ✅ TS 통과

        if (!club) {
          return res.status(404).json({ error: "클럽을 찾을 수 없습니다." });
        }

        return res.json(club);
      } catch (error: any) {
        console.error("❌ [GET /api/clubs/:id] failed:", error);
        res.status(500).json({ error: "클럽 조회 실패" });
      }
    },
  );

  // ✅ 클럽 생성 (테스트용)
  app.post(
    "/api/clubs",
    verifyFirebaseToken,
    async (req: Request, res: Response) => {
      try {
        const { name, region, description, logoUrl, bannerUrl, primaryColor } =
          req.body;

        if (!name) {
          return res.status(400).json({ error: "클럽 이름은 필수입니다." });
        }

        const newClub = await storage.createClub({
          name,
          region,
          description,
          logoUrl,
          bannerUrl,
          primaryColor,
        });

        console.log(`✅ [POST /api/clubs] created:`, newClub.name);
        res.status(201).json(newClub);
      } catch (error: any) {
        console.error("❌ [POST /api/clubs] failed:", error);
        res.status(500).json({ error: "클럽 생성 실패" });
      }
    },
  );
}
