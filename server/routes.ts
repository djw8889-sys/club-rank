import express from "express";
import { authenticateUser } from "./auth";
import { memStorage } from "./storage";

export const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "API alive" });
});

// ✅ 예시 club 엔드포인트
router.get("/clubs/:id", authenticateUser, (req, res) => {
  const club = memStorage.getClubById(req.params.id);
  if (!club) return res.status(404).json({ message: "Not found" });
  res.json(club);
});

// ✅ 예시 ranking 엔드포인트
router.get("/rankings/:userId", authenticateUser, (req, res) => {
  const data = memStorage.getUserRankingPoints(req.params.userId);
  res.json(data || { message: "No ranking data" });
});

export default router;
