import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Resolve bare "@/" imports used throughout the codebase
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Vite must emit to "dist/" — Vercel reads outputDirectory: "dist"
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split large vendor chunks so the AI service bundle stays lean
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
  },

  // In local dev, forward /api/* to a local Node server (port 3001)
  // so the same fetch("/api/analyze") call works in both envs
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
