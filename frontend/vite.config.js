import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, the Vite server (5173) proxies API + SSE calls to the Express
// backend (4000). In production, `npm run build` emits ./dist, which the
// backend serves directly from the same origin — so no proxy is needed there.
const BACKEND = "https://website-automation-agent-1dnb.onrender.com";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: BACKEND,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
