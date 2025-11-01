import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerClubRoutes } from "./routes/clubs.js";
import { registerRankingRoutes } from "./routes/rankings.js";

const app = express();

// ✅ 포트 충돌 방지용 (5000 → 5001)
const PORT = process.env.PORT || 5001;

// ✅ 환경변수 확인 로그
console.log(
  "🔥 ENV loaded:",
  process.env.FIREBASE_PROJECT_ID || "❌ Not Found",
);

app.use(cors());
app.use(express.json());

// ✅ ESM 호환 경로 계산
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ 정적 파일 경로 설정
const publicDir = path.resolve(__dirname, "../public");
app.use(express.static(publicDir));

// ✅ API 라우트 등록
registerClubRoutes(app);
registerRankingRoutes(app);

// ✅ 루트 페이지
app.get("/", (_, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ✅ SPA 라우팅 대응
app.get("*", (_, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
