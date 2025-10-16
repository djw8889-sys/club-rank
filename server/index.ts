import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes.js";
import { setupVite, log } from "./vite.js";

// ✅ ESM 환경용 __dirname 구현
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  const server = await registerRoutes(app);

  // ✅ Railway 실행 경로(/app/dist/index.js)에 맞게 distPath 수정
  const distPath = path.resolve(__dirname, "./public"); // 🔥 수정 포인트
  const hasBuiltFiles = fs.existsSync(distPath);

  if (app.get("env") === "development" && !hasBuiltFiles) {
    console.log("🚧 Development mode: using Vite dev server");
    await setupVite(app, server);
  } else {
    console.log("📦 Production mode: serving static files");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.use("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.error("❌ Could not find static build directory:", distPath);
      console.error("💡 Did you run `npm run build` before deploying?");
    }
  }

  // ✅ Railway 환경 호환 포트 감지
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = "0.0.0.0";
  const serverInstance = server.listen(port, host, () => {
    log(`✅ Server running on port ${port}`);
  });

  // ✅ 포트 충돌 시 자동 변경
  serverInstance.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      const newPort = port + 1;
      console.warn(`⚠️ Port ${port} is in use. Trying ${newPort}...`);
      server.listen(newPort, host, () => {
        log(`✅ Server now running on port ${newPort}`);
      });
    } else {
      throw err;
    }
  });
})();
