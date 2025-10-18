import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes.js";

// ✅ 안전한 __dirname 계산 (Railway 포함 모든 환경에서 유효)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ 정적 파일 경로 설정
const distPath = path.resolve(__dirname, "public");
console.log("📂 Static file path:", distPath);

if (fs.existsSync(distPath)) {
  // 🚀 프로덕션 모드 (Railway / Vercel)
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.warn(
    "⚠️ Static build directory not found. Run `npm run build` first.",
  );
}

// ✅ API 라우트 등록
(async () => {
  try {
    const server = await registerRoutes(app);

    // ✅ Railway 환경은 PORT 환경변수 필수 사용
    const PORT = parseInt(process.env.PORT || "5000", 10);
    const HOST = "0.0.0.0";

    server.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error starting server:", error);
    process.exit(1);
  }
})();
