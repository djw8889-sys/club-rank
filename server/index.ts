import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { registerRoutes } from "./routes.js";
import { setupVite, log } from "./vite.js";

// ✅ 안전한 __dirname 계산 (Railway에서도 항상 유효)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  const server = await registerRoutes(app);

  // ✅ dist/public 경로를 dist 내부 기준으로 절대 경로로 지정
  const distPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "public",
  );
  console.log("📂 Static file path:", distPath);

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
      console.error("💡 If not, run it locally or via Railway build script.");
    }
  }

  // ✅ Railway가 자동으로 PORT 설정하므로 그대로 사용
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = "0.0.0.0";

  try {
    server.listen(port, host, () => {
      log(`✅ Server running on port ${port}`);
    });
  } catch (err: any) {
    if (err.code === "EADDRINUSE") {
      const newPort = port + 1;
      console.warn(`⚠️ Port ${port} in use, trying ${newPort}...`);
      server.listen(newPort, host, () => {
        log(`✅ Server now running on port ${newPort}`);
      });
    } else {
      throw err;
    }
  }
})();
