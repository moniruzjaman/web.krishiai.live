"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

const SIDEBAR_LINKS = [
  { href: "/", icon: "🏠", label: "হোম" },
  { href: "/tools", icon: "🔧", label: "টুল" },
  { href: "/analyzer", icon: "📷", label: "এনালাইজার" },
  { href: "/learn", icon: "📚", label: "শিক্ষা" },
  { href: "/profile", icon: "👤", label: "প্রোফাইল" },
  { href: "/chat", icon: "💬", label: "চ্যাট" },
];

export default function TopNavbar() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const { lang, toggleLang } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  // Persist dark mode — read from localStorage after mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("krishi_dark");
      if (stored === "true") setDark(true);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("krishi_dark", String(dark));
  }, [dark]);

  // Share handler
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "কৃষি AI",
          text: "বাংলাদেশের কৃষকদের জন্য AI-চালিত কৃষি পরামর্শ সেবা",
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  // PWA install prompt detection
  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setCanInstall(true);
      // Show the topnav install button
      const btn = document.getElementById("krishi-topnav-install-btn");
      if (btn) {
        btn.classList.remove("hidden");
        btn.classList.add("flex");
      }
      // Also store for the InstallPrompt component
      (window as unknown as Record<string, unknown>).__krishiInstallPrompt = e;
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Handle install button click
  const handleInstall = useCallback(async () => {
    const promptEvent = (window as unknown as Record<string, unknown>).__krishiInstallPrompt as Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> } | undefined;
    if (!promptEvent || typeof (promptEvent as unknown as { prompt?: unknown }).prompt !== "function") {
      // Fallback: show instructions
      const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
      if (isIOS) {
        alert("Safari এর Share বাটন থেকে 'হোম স্ক্রিনে যোগ করুন' সিলেক্ট করুন।");
      }
      return;
    }
    try {
      await (promptEvent as unknown as { prompt: () => Promise<void> }).prompt();
      const result = await (promptEvent as unknown as { userChoice: Promise<{ outcome: string }> }).userChoice;
      if (result.outcome === "accepted") {
        setCanInstall(false);
        const btn = document.getElementById("krishi-topnav-install-btn");
        if (btn) {
          btn.classList.add("hidden");
          btn.classList.remove("flex");
        }
      }
    } catch {
      // silently fail
    }
  }, []);

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[99]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[260px] bg-white dark:bg-gray-900 z-[100] shadow-xl p-5 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <span className="text-lg font-bold text-[#1b8a3e]">কৃষি AI</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="bg-none border-none text-xl cursor-pointer text-gray-700 dark:text-gray-300"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-col gap-0.5">
          {SIDEBAR_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3.5 py-3 rounded-[10px] text-sm font-medium no-underline transition-colors duration-150 ${
                  isActive
                    ? "bg-[#f0fdf4] dark:bg-green-900/30 text-[#1b8a3e] dark:text-green-400 font-bold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-[#f0fdf4] dark:hover:bg-gray-800"
                }`}
              >
                <span>{link.icon}</span> {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Navbar */}
      <header className="bg-white dark:bg-gray-900 px-3.5 py-2.5 flex items-center gap-2.5 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 sm:px-6 sm:gap-3.5">
        {/* Hamburger */}
        <button
          className="flex flex-col justify-center gap-[5px] cursor-pointer w-[22px] bg-none border-none p-0 shrink-0"
          aria-label="Open menu"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span className="h-[2px] bg-gray-800 dark:bg-gray-200 rounded w-full block" />
          <span className="h-[2px] bg-gray-800 dark:bg-gray-200 rounded w-full block" />
          <span className="h-[2px] bg-gray-800 dark:bg-gray-200 rounded w-full block" />
        </button>

        {/* Logo */}
        <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 overflow-hidden">
          <img src="/logo.jpeg" alt="KrishiAI Logo" width="30" height="30" className="w-full h-full object-cover rounded-full" />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Install App Button */}
        {canInstall && (
          <button
            onClick={handleInstall}
            className="flex w-auto h-[26px] items-center gap-1 cursor-pointer bg-emerald-600 hover:bg-emerald-700 border-none text-white text-[10px] font-bold rounded-full px-2.5 transition-colors"
            aria-label="অ্যাপ ইনস্টল করুন"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            <span className="hidden sm:inline">ইনস্টল</span>
          </button>
        )}

        {/* Share */}
        <button
          className="w-[30px] h-[30px] flex items-center justify-center cursor-pointer bg-none border-none text-gray-600 dark:text-gray-400 p-0"
          aria-label="Share"
          onClick={handleShare}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>

        {/* Language toggle */}
        <div className="flex rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
          <button
            type="button"
            className={`px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition-colors border-none bg-transparent ${
              lang === "bn"
                ? "bg-[#1b8a3e] text-white"
                : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            }`}
            onClick={toggleLang}
            aria-label="Switch to Bengali"
          >
            বাং
          </button>
          <button
            type="button"
            className={`px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition-colors border-none bg-transparent ${
              lang === "en"
                ? "bg-[#1b8a3e] text-white"
                : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            }`}
            onClick={toggleLang}
            aria-label="Switch to English"
          >
            EN
          </button>
        </div>

        {/* Dark mode toggle */}
        <button
          className="w-[30px] h-[30px] flex items-center justify-center cursor-pointer bg-none border-none text-gray-600 dark:text-gray-400 p-0"
          onClick={() => setDark(!dark)}
          aria-label={dark ? "Light mode" : "Dark mode"}
        >
          {dark ? "☀️" : "🌙"}
        </button>

        {/* Avatar */}
        <div className="w-[34px] h-[34px] rounded-full shrink-0 relative cursor-pointer overflow-hidden">
          <img src="/logo.jpeg" alt="KrishiAI" width="34" height="34" className="w-full h-full object-cover rounded-full" />
        </div>
      </header>
    </>
  );
}
