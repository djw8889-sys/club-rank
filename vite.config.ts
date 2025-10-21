// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // ✅ client 폴더를 루트로 명시 (Docker 컨텍스트 호환)
  root: "./client",
  plugins: [react()],
  resolve: {
    alias: {
      // ✅ 절대경로로 client/src를 지정
      "@": path.resolve(__dirname, "client/src"),
    },
  },
  build: {
    // ✅ 서버에서 정적 파일을 서빙할 위치
    outDir: path.resolve(__dirname, "server/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
