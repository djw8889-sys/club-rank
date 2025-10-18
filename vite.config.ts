import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ 프로덕션 환경(Railway, Vercel) 완전 대응 버전
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false,
    target: "esnext",
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: false,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
