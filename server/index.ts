// server/index.ts
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerClubRoutes } from "./routes/club-routes.js";
import { registerRankingRoutes } from "./routes/ranking-routes.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// ✅ 현재 파일 경로 계산 (ESM 호환)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ 정적 파일 제공 (React build 결과)
const publicPath = path.join(__dirname, "../public");
app.use(express.static(publicPath));

// ✅ API 라우트 등록
registerClubRoutes(app);
registerRankingRoutes(app);

// ✅ 루트 페이지: React index.html 서빙
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// ✅ SPA 지원 (React Router 등)
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
