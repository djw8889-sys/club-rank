// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // ✅ Railway/Docker 컨테이너 기준: client를 루트로 지정
  root: "client",
  plugins: [react()],
  resolve: {
    alias: {
      // ✅ @ → client/src 절대경로
      "@": path.resolve(__dirname, "client/src"),
    },
  },
  build: {
    // ✅ 빌드 결과를 server/public 으로 출력
    outDir: path.resolve(__dirname, "server/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
