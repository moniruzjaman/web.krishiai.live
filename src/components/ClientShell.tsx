/**
 * ClientShell.tsx — Client-side wrapper for components that need browser APIs
 *
 * This wrapper is needed because layout.tsx is a Server Component,
 * but InstallPrompt requires `beforeinstallprompt` (browser API).
 * Also registers the PWA service worker for offline support.
 */

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import SplashScreen, {
  shouldShowSplash,
  markSplashShown,
} from "./SplashScreen";

const InstallPrompt = dynamic(() => import("./InstallPrompt"), {
  ssr: false,
});

export default function ClientShell() {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Show splash on first load of this session only.
    if (shouldShowSplash()) {
      setShowSplash(true);
    }
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
    markSplashShown();
  };

  useEffect(() => {
    // Register service worker for PWA offline support
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.warn("[SW] Registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[SW] Registration failed:", err);
        });
    }
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      <InstallPrompt />
    </>
  );
}
