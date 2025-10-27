import express from "express";
import { authenticateUser } from "./auth";
import { memStorage } from "./storage";

export const router = express.Router();

// ✅ 예시 라우트
router.get("/", (req, res) => {
  res.json({ message: "API working!" });
});

router.get("/clubs", authenticateUser, (req, res) => {
  res.json({ clubs: memStorage.getUserClubMemberships("test-user") });
});

export default router;
