/**
 * ClientShell.tsx — Client-side wrapper for components that need browser APIs
 *
 * This wrapper is needed because layout.tsx is a Server Component,
 * but InstallPrompt requires `beforeinstallprompt` (browser API).
 * Also registers the PWA service worker for offline support.
 */

"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";

const InstallPrompt = dynamic(() => import("./InstallPrompt"), {
  ssr: false,
});

export default function ClientShell() {
  useEffect(() => {
    // Register service worker for PWA offline support
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[SW] Registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[SW] Registration failed:", err);
        });
    }
  }, []);

  return <InstallPrompt />;
}
