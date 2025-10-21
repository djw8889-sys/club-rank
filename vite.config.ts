// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// ✅ 현재 디렉터리 기준으로 alias 자동 감지
export default defineConfig(({ command }) => {
  const basePath =
    process.cwd().includes("/app/client") || process.cwd().endsWith("client")
      ? process.cwd()
      : path.resolve(process.cwd(), "client");

  console.log("✅ [Vite Alias BasePath]:", basePath);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(basePath, "src"),
      },
    },
    build: {
      outDir: path.resolve(basePath, "../server/public"),
      emptyOutDir: true,
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
    },
  };
});
