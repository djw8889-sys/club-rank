import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { registerClubRoutes } from "./routes/clubs.js";
import { registerRankingRoutes } from "./routes/rankings.js";
import { registerClubAdminRoutes } from "./routes/club-admin.js";

async function startDevServer() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  console.log("🔥 ENV loaded:", process.env.FIREBASE_PROJECT_ID || "❌ Not Found");

  // CORS 설정
  app.use(
    cors({
      origin: true,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    })
  );

  app.use(express.json());

  // API 라우트 등록
  registerClubRoutes(app);
  registerRankingRoutes(app);
  registerClubAdminRoutes(app);

  // Vite 개발 서버 설정
  const vite = await createViteServer({
    root: "./client",
    server: { 
      middlewareMode: true,
      hmr: {
        port: 5173,
      },
      allowedHosts: true, // Allow all hosts including Replit domains
    },
    appType: "spa",
  });

  // Vite 미들웨어 사용 (API 라우트 이후에 배치)
  app.use(vite.middlewares);

  // 서버 실행
  app.listen(PORT, () => {
    console.log(`🚀 Dev server running at http://localhost:${PORT}`);
    console.log(`📦 Vite HMR active`);
  });
}

// Start the server
startDevServer().catch((err) => {
  console.error("Failed to start dev server:", err);
  process.exit(1);
});
