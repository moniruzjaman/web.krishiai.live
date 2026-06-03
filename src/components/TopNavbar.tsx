"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const [lang, setLang] = useState<"bn" | "en">("bn");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Persist dark mode
  useEffect(() => {
    const stored = localStorage.getItem("krishi_dark");
    if (stored === "true") setDark(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("krishi_dark", String(dark));
  }, [dark]);

  // Persist language
  useEffect(() => {
    const stored = localStorage.getItem("krishi_lang");
    if (stored === "en" || stored === "bn") setLang(stored);
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === "bn" ? "en" : "bn";
      localStorage.setItem("krishi_lang", next);
      return next;
    });
  }, []);

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
        className={`fixed top-0 left-0 bottom-0 w-[260px] bg-white z-[100] shadow-xl p-5 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <span className="text-lg font-bold text-[#1b8a3e]">কৃষি AI</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="bg-none border-none text-xl cursor-pointer text-gray-700"
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
                    ? "bg-[#f0fdf4] text-[#1b8a3e] font-bold"
                    : "text-gray-700 hover:bg-[#f0fdf4]"
                }`}
              >
                <span>{link.icon}</span> {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Navbar */}
      <header className="bg-white px-3.5 py-2.5 flex items-center gap-2.5 border-b border-gray-200 sticky top-0 z-50 sm:px-6 sm:gap-3.5">
        {/* Hamburger */}
        <button
          className="flex flex-col justify-center gap-[5px] cursor-pointer w-[22px] bg-none border-none p-0 shrink-0"
          aria-label="Open menu"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span className="h-[2px] bg-gray-800 rounded w-full block" />
          <span className="h-[2px] bg-gray-800 rounded w-full block" />
          <span className="h-[2px] bg-gray-800 rounded w-full block" />
        </button>

        {/* Logo */}
        <div className="w-[30px] h-[30px] bg-[#1b8a3e] rounded-full flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M17 8C8 10 5.9 16.17 3.82 19.83c.17-.05.33-.12.5-.17C6 19 7.5 18.5 9 18.5c3.5 0 5.5-2 8-4.5S21 8 21 8c-1.5 1-3.5 1.5-5.5 1.5C14 9.5 15.5 8 17 8z"
              fill="#fff"
            />
            <path
              d="M3.82 19.83C3.27 20.72 3 21.5 3 22c0 0 2-1 4.17-2.17"
              stroke="#fff"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Share */}
        <button
          className="w-[30px] h-[30px] flex items-center justify-center cursor-pointer bg-none border-none text-gray-600 p-0"
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
        <div className="flex rounded-full overflow-hidden border border-gray-200 shrink-0">
          <span
            className={`px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition-colors ${
              lang === "bn"
                ? "bg-[#1b8a3e] text-white"
                : "bg-white text-gray-500"
            }`}
            onClick={toggleLang}
          >
            বাং
          </span>
          <span
            className={`px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition-colors ${
              lang === "en"
                ? "bg-[#1b8a3e] text-white"
                : "bg-white text-gray-500"
            }`}
            onClick={toggleLang}
          >
            EN
          </span>
        </div>

        {/* Dark mode toggle */}
        <button
          className="w-[30px] h-[30px] flex items-center justify-center cursor-pointer bg-none border-none text-gray-600 p-0"
          onClick={() => setDark(!dark)}
          aria-label={dark ? "Light mode" : "Dark mode"}
        >
          {dark ? "☀️" : "🌙"}
        </button>

        {/* Avatar */}
        <div className="w-[34px] h-[34px] bg-[#1b8a3e] rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 relative cursor-pointer">
          ক
          <div className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] bg-white rounded-full flex items-center justify-center">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
              <path
                d="M17 8C8 10 5.9 16.17 3.82 19.83c.17-.05.33-.12.5-.17C6 19 7.5 18.5 9 18.5c3.5 0 5.5-2 8-4.5S21 8 21 8c-1.5 1-3.5 1.5-5.5 1.5C14 9.5 15.5 8 17 8z"
                fill="#1b4332"
              />
            </svg>
          </div>
        </div>
      </header>
    </>
  );
}
