import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes.js";

// ✅ __dirname 계산
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ 정적 파일 경로 설정
const distPath = path.resolve(__dirname, "public");
console.log("📂 Static file path:", distPath);

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.warn("⚠️ No build directory found. Run `npm run build` first.");
}

// ✅ API 라우트 등록 및 서버 실행
(async () => {
  try {
    // 🔹 registerRoutes가 server를 반환하지 않더라도 app 그대로 사용
    await registerRoutes(app);

    const PORT = parseInt(process.env.PORT || "5000", 10);
    const HOST = "0.0.0.0";

    // ✅ app.listen으로 직접 서버 실행
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error starting server:", error);
    process.exit(1);
  }
})();
