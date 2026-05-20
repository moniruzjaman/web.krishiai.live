import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./services/i18n";
import "./index.css";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  environment: import.meta.env.MODE,
});

// ── PWA: Register service worker ──────────────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// ── Offline queue: drain pending requests when back online ─────────────────────
import { processRequestQueue } from "@/services/offlineStorage";
const drainQueue = () => { processRequestQueue().catch(() => {}); };
window.addEventListener("online", drainQueue);

// Listen for SW sync signal (background-sync event relayed from service worker)
navigator.serviceWorker?.addEventListener("message", (e) => {
  if (e.data?.type === "process-queue") drainQueue();
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Sentry.ErrorBoundary fallback={<div className="flex items-center justify-center min-h-screen text-center p-4"><div><h1 className="text-xl font-bold mb-2">Something went wrong</h1><p className="text-gray-500">Please try refreshing the page.</p></div></div>}>
        <App />
      </Sentry.ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
