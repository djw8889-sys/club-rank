// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: "client", // 👈 명시적으로 client 디렉터리 기준
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
    },
  },
  build: {
    outDir: "../dist", // server/public 대신 상위로 출력
    emptyOutDir: true,
  },
});
