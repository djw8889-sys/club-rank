// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  // ✅ root 제거 (빌드 경로 꼬임 방지)
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"), // 🚀 핵심: 현재 /app/client 기준
    },
  },
  build: {
    outDir: "../server/public", // 상대경로로 빌드
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
