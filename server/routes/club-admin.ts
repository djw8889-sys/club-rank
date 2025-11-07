import type { Express, Request, Response } from "express";
import { authenticateUser } from "../auth.js";
import { storage } from "../storage.js";
import { insertClubDuesSchema, insertClubAttendanceSchema, insertClubMeetingsSchema } from "../shared/schema.js";

/**
 * Club Admin 관련 API 라우트 등록
 * - 회비 관리 (Dues Management)
 * - 출석 관리 (Attendance Management)
 * - 정기모임 관리 (Regular Meeting Management)
 */
export function registerClubAdminRoutes(app: Express) {
  // ========== 회비 관리 (Dues) ==========

  /**
   * ✅ 클럽 회비 목록 조회
   * GET /api/dues/:clubId
   */
  app.get(
    "/api/dues/:clubId",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const clubId = req.params.clubId;
        const userId = req.query.userId as string | undefined;
        
        console.log(`🔍 [GET /api/dues/${clubId}] Fetching dues, userId:`, userId);

        const dues = storage.getClubDues(clubId, userId);
        console.log(`✅ [GET /api/dues/${clubId}] Found ${dues.length} records`);

        return res.json(dues);
      } catch (error: any) {
        console.error("❌ [GET /api/dues/:clubId] failed:", error);
        res.status(500).json({ error: "회비 조회 실패" });
      }
    }
  );

  /**
   * ✅ 회비 생성
   * POST /api/dues
   */
  app.post(
    "/api/dues",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const parsed = insertClubDuesSchema.safeParse(req.body);
        
        if (!parsed.success) {
          return res.status(400).json({ error: "잘못된 요청 데이터", details: parsed.error });
        }

        console.log("🔍 [POST /api/dues] Creating dues:", parsed.data);

        const newDues = storage.createDues(parsed.data);
        console.log("✅ [POST /api/dues] Dues created:", newDues.id);

        return res.status(201).json(newDues);
      } catch (error: any) {
        console.error("❌ [POST /api/dues] failed:", error);
        res.status(500).json({ error: "회비 생성 실패" });
      }
    }
  );

  /**
   * ✅ 회비 상태 업데이트
   * PATCH /api/dues/:id
   */
  app.patch(
    "/api/dues/:id",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const duesId = parseInt(req.params.id, 10);
        const { status, paidAt } = req.body;

        console.log(`🔍 [PATCH /api/dues/${duesId}] Updating status:`, status);

        const updatedDues = storage.updateDuesStatus(
          duesId,
          status,
          paidAt ? new Date(paidAt) : undefined
        );

        if (!updatedDues) {
          return res.status(404).json({ error: "회비를 찾을 수 없습니다." });
        }

        console.log(`✅ [PATCH /api/dues/${duesId}] Status updated`);
        return res.json(updatedDues);
      } catch (error: any) {
        console.error("❌ [PATCH /api/dues/:id] failed:", error);
        res.status(500).json({ error: "회비 업데이트 실패" });
      }
    }
  );

  /**
   * ✅ 회비 삭제
   * DELETE /api/dues/:id
   */
  app.delete(
    "/api/dues/:id",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const duesId = parseInt(req.params.id, 10);

        console.log(`🔍 [DELETE /api/dues/${duesId}] Deleting dues`);

        const deleted = storage.deleteDues(duesId);

        if (!deleted) {
          return res.status(404).json({ error: "회비를 찾을 수 없습니다." });
        }

        console.log(`✅ [DELETE /api/dues/${duesId}] Deleted successfully`);
        return res.json({ success: true });
      } catch (error: any) {
        console.error("❌ [DELETE /api/dues/:id] failed:", error);
        res.status(500).json({ error: "회비 삭제 실패" });
      }
    }
  );

  // ========== 출석 관리 (Attendance) ==========

  /**
   * ✅ 클럽 출석 기록 조회
   * GET /api/attendance/:clubId
   */
  app.get(
    "/api/attendance/:clubId",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const clubId = req.params.clubId;
        const eventDate = req.query.eventDate
          ? new Date(req.query.eventDate as string)
          : undefined;

        console.log(`🔍 [GET /api/attendance/${clubId}] Fetching attendance`);

        const attendance = storage.getClubAttendance(clubId, eventDate);
        console.log(`✅ [GET /api/attendance/${clubId}] Found ${attendance.length} records`);

        return res.json(attendance);
      } catch (error: any) {
        console.error("❌ [GET /api/attendance/:clubId] failed:", error);
        res.status(500).json({ error: "출석 조회 실패" });
      }
    }
  );

  /**
   * ✅ 출석 기록 생성
   * POST /api/attendance
   */
  app.post(
    "/api/attendance",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const parsed = insertClubAttendanceSchema.safeParse(req.body);

        if (!parsed.success) {
          return res.status(400).json({ error: "잘못된 요청 데이터", details: parsed.error });
        }

        console.log("🔍 [POST /api/attendance] Creating attendance:", parsed.data);

        const newAttendance = storage.createAttendance(parsed.data);
        console.log("✅ [POST /api/attendance] Attendance created:", newAttendance.id);

        return res.status(201).json(newAttendance);
      } catch (error: any) {
        console.error("❌ [POST /api/attendance] failed:", error);
        res.status(500).json({ error: "출석 생성 실패" });
      }
    }
  );

  /**
   * ✅ 출석 상태 업데이트
   * PATCH /api/attendance/:id
   */
  app.patch(
    "/api/attendance/:id",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const attendanceId = parseInt(req.params.id, 10);
        const { status, notes } = req.body;

        console.log(`🔍 [PATCH /api/attendance/${attendanceId}] Updating status:`, status);

        const updated = storage.updateAttendanceStatus(attendanceId, status, notes);

        if (!updated) {
          return res.status(404).json({ error: "출석 기록을 찾을 수 없습니다." });
        }

        console.log(`✅ [PATCH /api/attendance/${attendanceId}] Status updated`);
        return res.json(updated);
      } catch (error: any) {
        console.error("❌ [PATCH /api/attendance/:id] failed:", error);
        res.status(500).json({ error: "출석 업데이트 실패" });
      }
    }
  );

  /**
   * ✅ 출석 기록 삭제
   * DELETE /api/attendance/:id
   */
  app.delete(
    "/api/attendance/:id",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const attendanceId = parseInt(req.params.id, 10);

        console.log(`🔍 [DELETE /api/attendance/${attendanceId}] Deleting attendance`);

        const deleted = storage.deleteAttendance(attendanceId);

        if (!deleted) {
          return res.status(404).json({ error: "출석 기록을 찾을 수 없습니다." });
        }

        console.log(`✅ [DELETE /api/attendance/${attendanceId}] Deleted successfully`);
        return res.json({ success: true });
      } catch (error: any) {
        console.error("❌ [DELETE /api/attendance/:id] failed:", error);
        res.status(500).json({ error: "출석 삭제 실패" });
      }
    }
  );

  // ========== 정기모임 관리 (Meetings) ==========

  /**
   * ✅ 클럽 모임 목록 조회
   * GET /api/meetings/:clubId
   */
  app.get(
    "/api/meetings/:clubId",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const clubId = req.params.clubId;

        console.log(`🔍 [GET /api/meetings/${clubId}] Fetching meetings`);

        const meetings = storage.getClubMeetings(clubId);
        console.log(`✅ [GET /api/meetings/${clubId}] Found ${meetings.length} meetings`);

        return res.json(meetings);
      } catch (error: any) {
        console.error("❌ [GET /api/meetings/:clubId] failed:", error);
        res.status(500).json({ error: "모임 조회 실패" });
      }
    }
  );

  /**
   * ✅ 모임 단건 조회
   * GET /api/meetings/detail/:id
   */
  app.get(
    "/api/meetings/detail/:id",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const meetingId = parseInt(req.params.id, 10);

        console.log(`🔍 [GET /api/meetings/detail/${meetingId}] Fetching meeting`);

        const meeting = storage.getMeetingById(meetingId);

        if (!meeting) {
          return res.status(404).json({ error: "모임을 찾을 수 없습니다." });
        }

        console.log(`✅ [GET /api/meetings/detail/${meetingId}] Found meeting`);
        return res.json(meeting);
      } catch (error: any) {
        console.error("❌ [GET /api/meetings/detail/:id] failed:", error);
        res.status(500).json({ error: "모임 조회 실패" });
      }
    }
  );

  /**
   * ✅ 모임 생성
   * POST /api/meetings
   */
  app.post(
    "/api/meetings",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user?.uid;
        const parsed = insertClubMeetingsSchema.safeParse({
          ...req.body,
          createdBy: userId,
        });

        if (!parsed.success) {
          return res.status(400).json({ error: "잘못된 요청 데이터", details: parsed.error });
        }

        console.log("🔍 [POST /api/meetings] Creating meeting:", parsed.data);

        const newMeeting = storage.createMeeting(parsed.data);
        console.log("✅ [POST /api/meetings] Meeting created:", newMeeting.id);

        return res.status(201).json(newMeeting);
      } catch (error: any) {
        console.error("❌ [POST /api/meetings] failed:", error);
        res.status(500).json({ error: "모임 생성 실패" });
      }
    }
  );

  /**
   * ✅ 모임 참가
   * POST /api/meetings/:id/join
   */
  app.post(
    "/api/meetings/:id/join",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const meetingId = parseInt(req.params.id, 10);
        const userId = (req as any).user?.uid;

        console.log(`🔍 [POST /api/meetings/${meetingId}/join] User ${userId} joining`);

        const updated = storage.joinMeeting(meetingId, userId);

        if (!updated) {
          return res.status(400).json({ error: "모임 참가 실패 (정원 초과 또는 이미 참가)" });
        }

        console.log(`✅ [POST /api/meetings/${meetingId}/join] User joined successfully`);
        return res.json(updated);
      } catch (error: any) {
        console.error("❌ [POST /api/meetings/:id/join] failed:", error);
        res.status(500).json({ error: "모임 참가 실패" });
      }
    }
  );

  /**
   * ✅ 모임 참가 취소
   * POST /api/meetings/:id/leave
   */
  app.post(
    "/api/meetings/:id/leave",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const meetingId = parseInt(req.params.id, 10);
        const userId = (req as any).user?.uid;

        console.log(`🔍 [POST /api/meetings/${meetingId}/leave] User ${userId} leaving`);

        const updated = storage.leaveMeeting(meetingId, userId);

        if (!updated) {
          return res.status(404).json({ error: "모임을 찾을 수 없습니다." });
        }

        console.log(`✅ [POST /api/meetings/${meetingId}/leave] User left successfully`);
        return res.json(updated);
      } catch (error: any) {
        console.error("❌ [POST /api/meetings/:id/leave] failed:", error);
        res.status(500).json({ error: "모임 참가 취소 실패" });
      }
    }
  );

  /**
   * ✅ 모임 업데이트
   * PATCH /api/meetings/:id
   */
  app.patch(
    "/api/meetings/:id",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const meetingId = parseInt(req.params.id, 10);
        const updates = req.body;

        console.log(`🔍 [PATCH /api/meetings/${meetingId}] Updating meeting`);

        const updated = storage.updateMeeting(meetingId, updates);

        if (!updated) {
          return res.status(404).json({ error: "모임을 찾을 수 없습니다." });
        }

        console.log(`✅ [PATCH /api/meetings/${meetingId}] Meeting updated`);
        return res.json(updated);
      } catch (error: any) {
        console.error("❌ [PATCH /api/meetings/:id] failed:", error);
        res.status(500).json({ error: "모임 업데이트 실패" });
      }
    }
  );

  /**
   * ✅ 모임 삭제
   * DELETE /api/meetings/:id
   */
  app.delete(
    "/api/meetings/:id",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const meetingId = parseInt(req.params.id, 10);

        console.log(`🔍 [DELETE /api/meetings/${meetingId}] Deleting meeting`);

        const deleted = storage.deleteMeeting(meetingId);

        if (!deleted) {
          return res.status(404).json({ error: "모임을 찾을 수 없습니다." });
        }

        console.log(`✅ [DELETE /api/meetings/${meetingId}] Deleted successfully`);
        return res.json({ success: true });
      } catch (error: any) {
        console.error("❌ [DELETE /api/meetings/:id] failed:", error);
        res.status(500).json({ error: "모임 삭제 실패" });
      }
    }
  );
}
