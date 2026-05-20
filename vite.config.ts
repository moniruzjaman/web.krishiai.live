import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [sentryVitePlugin({
          org: "krishi-ai",
          project: "web",
          authToken: process.env.SENTRY_AUTH_TOKEN,
        })]
      : []),
    ...(process.env.ANALYZE
      ? [visualizer({ open: true, gzipSize: true })]
      : []),
  ],

  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },

  build: {
    outDir:     "dist",
    emptyOutDir: true,
    sourcemap: process.env.SENTRY_AUTH_TOKEN ? "hidden" : false,
    cssMinify:  true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/react") ||
              id.includes("node_modules/react-dom") ||
              id.includes("node_modules/scheduler")) {
            return "vendor";
          }
          if (id.includes("react-router")) return "router";
          if (id.includes("leaflet")) return "leaflet-lib";
        },
      },
    },
  },

  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
});
