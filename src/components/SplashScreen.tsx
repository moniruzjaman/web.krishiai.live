/**
 * SplashScreen.tsx — App launch splash (ported from krishi-ai reference)
 *
 * Shows on initial page load only:
 * - Full-screen green gradient (#1B5E20 → #2E7D32 → #43A047)
 * - Animated logo scale-in (spring-like ease)
 * - App name + subtitle
 * - Loading bar that fills over 1.8s
 * - Bengali tagline
 * - Fades out via CSS transition
 *
 * Pure CSS/Tailwind — no external animation dependency.
 */

"use client";

import { useEffect } from "react";

const STORAGE_KEY = "krishi_splash_seen_v1";

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 1800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #43a047 100%)",
      }}
    >
      <div
        className="flex flex-col items-center gap-4"
        style={{
          animation: "splash-scale-in 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <span className="text-5xl">🌾</span>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">কৃষি AI</h1>
          <p className="text-white/70 text-sm mt-1">স্মার্ট কৃষি সহায়ক</p>
        </div>
      </div>

      <div
        className="h-1 bg-white/30 rounded-full mt-8 overflow-hidden w-[120px]"
        style={{ animation: "splash-bar 0.8s 0.8s cubic-bezier(0.4,0,0.2,1) both" }}
      >
        <div className="h-full w-full bg-white/80 rounded-full" />
      </div>

      <p
        className="text-white/50 text-xs mt-4"
        style={{ animation: "splash-fade 0.5s 1.2s ease both" }}
      >
        বাংলাদেশের কৃষকদের জন্য
      </p>
    </div>
  );
}

/** Check (client-side only) whether splash should show this load. */
export function shouldShowSplash(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) !== "true";
  } catch {
    return true;
  }
}

/** Mark splash as shown for this session. */
export function markSplashShown() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    /* storage full */
  }
}