// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // ✅ Railway 빌드에서 alias가 꼬이지 않도록 root 제거
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"), // 절대경로 고정
    },
  },
  build: {
    outDir: path.resolve(__dirname, "server/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
