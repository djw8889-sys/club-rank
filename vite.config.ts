// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // ✅ client 디렉토리를 빌드 루트로 명시
  root: path.resolve(__dirname, "client"),
  plugins: [react()],
  resolve: {
    alias: {
      // ✅ @를 client/src 절대경로로 고정
      "@": path.resolve(__dirname, "client/src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "server/public"),
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
