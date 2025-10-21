// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  // ✅ Railway/Docker 환경에서도 alias 절대경로로 고정
  resolve: {
    alias: {
      "@": path.resolve("/app/client/src"),
    },
  },
  build: {
    outDir: path.resolve("/app/server/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
