// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Railway/Docker 환경 모두에서 절대경로 alias를 강제 인식하도록 설정
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "server/public"),
    emptyOutDir: true,
    rollupOptions: {
      // ✅ Toaster 파일이 로컬에 있음에도 Rollup이 외부화하려 할 때 무시하도록 설정
      external: [],
    },
  },
  optimizeDeps: {
    include: ["@/components/ui/Toaster"],
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
