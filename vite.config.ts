import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },

  build: {
    outDir:     "dist",
    emptyOutDir: true,
    sourcemap:  false,
    // Raise chunk size warning threshold (we accept ~300KB max)
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core → vendor chunk (cached forever)
          if (id.includes("node_modules/react") ||
              id.includes("node_modules/react-dom") ||
              id.includes("node_modules/scheduler")) {
            return "vendor";
          }
          // React Router → separate chunk
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
