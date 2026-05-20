import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { visualizer } from "rollup-plugin-visualizer";
import { resolve } from "path";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const BUILD_ID = Date.now().toString(36);

function swVersionPlugin(): Plugin {
  return {
    name: "sw-version",
    closeBundle() {
      const swPath = resolve(__dirname, "dist", "sw.js");
      const content = readFileSync(swPath, "utf-8").replace(/__BUILD_ID__/g, BUILD_ID);
      writeFileSync(swPath, content, "utf-8");
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    swVersionPlugin(),
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
    alias: { "@": resolve(__dirname, "./src") },
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
              id.includes("node_modules/scheduler") ||
              id.includes("node_modules/react-leaflet") ||
              id.includes("node_modules/@react-leaflet") ||
              id.includes("node_modules/leaflet")) {
            return "vendor";
          }
          if (id.includes("react-router")) return "router";
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
