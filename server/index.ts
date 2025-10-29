// server/index.ts
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerClubRoutes } from "./routes/clubs.js";
import { registerRankingRoutes } from "./routes/rankings.js";
import { storage } from "./storage.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// ✅ ES Module 호환용 경로 계산
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ 정적 파일 경로 설정 (client → dist → public)
const publicDir = path.resolve(__dirname, "../public");
app.use(express.static(publicDir));

// ✅ API 라우트 등록
registerClubRoutes(app);
registerRankingRoutes(app);

// ✅ 기본 루트 핸들러
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ✅ SPA 라우팅 지원 (react-router-dom 등)
app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ✅ 서버 구동
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
