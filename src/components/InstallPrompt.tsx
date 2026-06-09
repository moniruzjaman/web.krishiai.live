/**
 * InstallPrompt.tsx — PWA Install Banner
 *
 * Features:
 * - Shows a dismissible banner prompting the user to install KrishiAI
 * - Stores deferred prompt globally so profile page button can also trigger install
 * - Detects iOS Safari for manual install instructions
 * - Persists dismissal in localStorage so it's not annoying
 * - Also listens for clicks on #krishi-install-btn (profile page)
 */

"use client";

import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "krishi_install_dismissed";

// Global store for deferred prompt so other components can trigger install
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

export function getInstallPrompt(): BeforeInstallPromptEvent | null {
  return globalDeferredPrompt;
}

export function isAppInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
      return;
    }

    // Check if previously dismissed
    if (localStorage.getItem(DISMISSED_KEY) === "true") return;

    // Detect iOS Safari (no beforeinstallprompt support)
    const isIOSSafari = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) &&
      /safari/.test(navigator.userAgent.toLowerCase()) &&
      !/crios|fxios/.test(navigator.userAgent.toLowerCase());
    setIsIOS(isIOSSafari);

    if (isIOSSafari) {
      // Show iOS manual install instructions after a short delay
      const t = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(t);
    }

    // Listen for the beforeinstallprompt event (Chrome, Edge, Samsung Internet)
    const handler = (e: Event) => {
      e.preventDefault();
      const prompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(prompt);
      globalDeferredPrompt = prompt;
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Listen for clicks on the profile page install button
  useEffect(() => {
    const handleProfileInstallClick = async () => {
      const prompt = globalDeferredPrompt;
      if (!prompt) {
        // No install prompt available — show iOS instructions or info
        const isIOSSafari = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) &&
          /safari/.test(navigator.userAgent.toLowerCase());
        if (isIOSSafari) {
          alert("Safari এর Share বাটন থেকে 'হোম স্ক্রিনে যোগ করুন' সিলেক্ট করুন।");
        } else {
          alert("এই ব্রাউজারে ইনস্টল সুবিধা নেই। Chrome বা Edge ব্যবহার করুন।");
        }
        return;
      }

      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === "accepted") {
          setShowBanner(false);
        }
      } catch {
        // Silently fail
      }
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
    };

    const btn = document.getElementById("krishi-install-btn");
    if (btn) {
      btn.addEventListener("click", handleProfileInstallClick);
      return () => btn.removeEventListener("click", handleProfileInstallClick);
    }
  }, []);

  const handleInstall = useCallback(async () => {
    const prompt = deferredPrompt || globalDeferredPrompt;
    if (!prompt) return;
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
    } catch {
      // Silently fail
    }
    setDeferredPrompt(null);
    globalDeferredPrompt = null;
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // Ignore
    }
  }, []);

  if (!showBanner || isStandalone) return null;

  return (
    <div className="fixed bottom-[72px] left-0 right-0 z-[60] px-4 pb-2 animate-slide-up">
      <div className="max-w-[768px] mx-auto bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] rounded-2xl p-4 shadow-2xl border border-green-600/30">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 text-lg">
            📲
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-sm mb-1">
              অ্যাপ ইনস্টল করুন
            </div>
            <div className="text-white/70 text-[12px] leading-relaxed mb-3">
              {isIOS
                ? "Safari এর Share বাটন থেকে 'হোম স্ক্রিনে যোগ করুন' সিলেক্ট করুন"
                : "KrishiAI আপনার ফোনে ইনস্টল করুন — দ্রুত অ্যাক্সেস, অফলাইন সাপোর্ট"}
            </div>
            <div className="flex gap-2">
              {isIOS ? (
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); handleDismiss(); }}
                  className="bg-green-500 hover:bg-green-400 text-white font-bold text-[12px] rounded-full px-4 py-2 transition-colors active:scale-95 shadow-md no-underline"
                >
                  বুঝেছি ✓
                </a>
              ) : (
                <button
                  onClick={handleInstall}
                  className="bg-green-500 hover:bg-green-400 text-white font-bold text-[12px] rounded-full px-4 py-2 transition-colors active:scale-95 shadow-md border-none cursor-pointer"
                >
                  📲 ইনস্টল করুন
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="bg-white/10 hover:bg-white/20 text-white/70 font-medium text-[12px] rounded-full px-4 py-2 transition-colors border border-white/10 cursor-pointer"
              >
                পরে
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
