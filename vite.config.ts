// client/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // ✅ 절대경로로 강제 고정 (Railway Docker 환경에서도 동작)
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    // ✅ 빌드 결과를 서버가 읽을 위치로 출력
    outDir: path.resolve(__dirname, "../server/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
