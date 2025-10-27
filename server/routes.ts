import express from "express";
import { authenticateUser } from "./auth";
import { storage } from "./storage"; // ✅ 이름만 맞게 수정

export const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "API alive" });
});

// ✅ club 엔드포인트
router.get("/clubs/:id", authenticateUser, (req, res) => {
  const club = storage.getClubById(req.params.id); // ✅ 호출 그대로
  if (!club) return res.status(404).json({ message: "Not found" });
  res.json(club);
});

// ✅ ranking 엔드포인트
router.get("/rankings/:userId", authenticateUser, (req, res) => {
  const data = storage.getUserRankingPoints(req.params.userId);
  res.json(data || { message: "No ranking data" });
});

export default router;
