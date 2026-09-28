/**
 * AndroidStatusBar.tsx — Simulates an Android status bar in standalone/PWA mode.
 *
 * Ported from krishi-ai reference (`StatusBar` component).
 * Shows only when the app is installed as a PWA (display-mode: standalone)
 * or running inside a native WebView — otherwise hidden.
 * Displays Bengali-localized time + signal/battery icons.
 */

"use client";

import { useState, useEffect } from "react";

export default function AndroidStatusBar() {
  const [visible, setVisible] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    // Only show in standalone PWA mode or native WebView
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS standalone
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (!isStandalone) return;
    setVisible(true);

    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })
      );
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div className="status-bar">
      <span className="font-medium">{time || "১২:০০"}</span>
      <div className="flex items-center gap-2">
        <span>📶</span>
        <span>📶</span>
        <span>📶</span>
        <span>🔋</span>
      </div>
    </div>
  );
}