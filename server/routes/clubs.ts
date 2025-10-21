import { Express, Request, Response } from "express";
import { verifyFirebaseToken } from "../auth";
import { storage } from "../storage";

/**
 * Club 관련 API 라우트 등록
 * - 내 클럽 목록 조회
 * - 클럽 생성 (선택)
 * - 클럽 단건 조회
 */
export function registerClubRoutes(app: Express) {
  /**
   * ✅ 내 클럽 멤버십 목록 조회
   * - 로그인 사용자의 클럽 멤버십이 없을 경우 기본 클럽 자동 생성 및 가입
   * - 항상 최소 1개 이상의 클럽정보를 반환하도록 보장
   */
  app.get(
    "/api/clubs/my-membership",
    verifyFirebaseToken,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user?.uid;
        if (!userId) {
          return res.status(401).json({ error: "인증 정보가 없습니다." });
        }

        // 🔥 없으면 기본 클럽에 자동 가입
        await storage.ensureDefaultMembership(userId);

        const memberships = await storage.getUserClubMemberships(userId);
        const clubs = await Promise.all(
          memberships.map(async (m) => ({
            membership: m,
            club: (await storage.getClubById(m.clubId))!,
          })),
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
   * @param id 클럽 ID (숫자)
   */
  app.get(
    "/api/clubs/:id",
    verifyFirebaseToken,
    async (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: "잘못된 클럽 ID입니다." });
        }

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
   * - 추후 관리 기능 추가 시 사용
   */
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
