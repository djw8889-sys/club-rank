import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  // ✅ root 제거: 루트에서 client 디렉터리를 직접 지정하지 않음
  // 대신 alias가 정확히 client/src 를 가리키도록 유지
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  build: {
    // ✅ client 기준으로 public 디렉터리에 출력
    outDir: path.resolve(__dirname, "server", "public"),
    emptyOutDir: true,
    sourcemap: false,
    target: "esnext",
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  preview: {
    port: 4173,
  },
});
