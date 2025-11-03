import type { Express, Request, Response, NextFunction } from "express";
import { authenticateUser } from "../auth.js"; // ✅ 미들웨어 형태로 변경됨
import { storage } from "../storage.js";

/**
 * Club 관련 API 라우트 등록
 */
export function registerClubRoutes(app: Express) {
  /**
   * ✅ 내 클럽 멤버십 목록 조회
   * - 로그인 사용자의 클럽 멤버십이 없을 경우 기본 클럽 자동 생성 및 가입
   * - 항상 최소 1개 이상의 클럽정보를 반환하도록 보장
   */
  app.get(
    "/api/clubs/my-membership",
    authenticateUser, // ✅ verifyFirebaseToken → authenticateUser 변경
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user?.uid;
        if (!userId) {
          return res.status(401).json({ error: "인증 정보가 없습니다." });
        }

        // ✅ 기본 클럽 자동 생성
        await storage.ensureDefaultMembership(userId);

        // ✅ 멤버십 + 클럽 데이터 함께 반환
        const memberships = await storage.getUserClubMemberships(userId);

        const clubs = await Promise.all(
          memberships.map(async (m) => {
            const clubId = m.membership?.clubId ?? m.club?.id;
            const clubData = m.club ?? (await storage.getClubById(clubId))!;
            return {
              membership: m.membership,
              club: clubData,
            };
          }),
        );

        return res.json({ items: clubs });
      } catch (error: any) {
        console.error("❌ [GET /api/clubs/my-membership] failed:", error);
        res.status(500).json({ error: "클럽정보 로드 실패" });
      }
    },
  );

  /**
   * ✅ 클럽 단건 조회
   */
  app.get(
    "/api/clubs/:id",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const id = req.params.id;
        const club = await storage.getClubById(id);

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

  /**
   * ✅ 클럽 생성 (테스트용 or 관리자용)
   */
  app.post(
    "/api/clubs",
    authenticateUser,
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
