import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes.js";
import admin from "firebase-admin";
import serviceAccount from "../match-point-0918-firebase-adminsdk-fbsvc-37b91a00fa.json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ Firebase Admin 초기화
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
  }
}

// ✅ 정적 파일 경로
const distPath = path.resolve(__dirname, "public");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.warn("⚠️ No public directory found. Run `npm run build` first.");
}

// ✅ API 라우트 및 서버 리스닝
(async () => {
  try {
    await registerRoutes(app);
    const PORT = parseInt(process.env.PORT || "5000", 10);
    const HOST = "0.0.0.0";
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error starting server:", error);
    process.exit(1);
  }
})();
