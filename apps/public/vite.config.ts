import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: rootDir,
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@multitrack/api-client": path.resolve(rootDir, "../../packages/api-client/src/index.ts"),
      "@multitrack/types": path.resolve(rootDir, "../../packages/types/src/index.ts"),
    },
  },
  optimizeDeps: {
    exclude: ["@multitrack/api-client", "@multitrack/types"],
  },
  server: {
    host: true,
    port: 5174,
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
