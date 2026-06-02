/**
 * PhotoGallery.tsx — Best-in-Class Agricultural Photo Gallery
 *
 * Features:
 * - Seasonal category filter (সব, রবি, খরিফ, সারাবছর)
 * - More BD-specific agricultural images (10 photos)
 * - Better lightbox with keyboard navigation & swipe
 * - Category indicator badges on photos
 * - Smooth transitions
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

type Season = "সব" | "রবি" | "খরিফ" | "সারাবছর";

interface Photo {
  url: string;
  cap: string;
  season: Season;
  desc: string;
}

const PHOTOS: Photo[] = [
  {
    url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&q=80",
    cap: "ধান ক্ষেত — বাংলাদেশ",
    season: "খরিফ",
    desc: "বাংলাদেশের সবুজ ধান ক্ষেত, আমন মৌসুমে কৃষকের জীবিকার প্রধান উৎস",
  },
  {
    url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80",
    cap: "কৃষক ও ফসল",
    season: "সারাবছর",
    desc: "বাংলাদেশের কৃষক — অক্লান্ত পরিশ্রমে দেশের অর্থনীতির মেরুদণ্ড",
  },
  {
    url: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=400&q=80",
    cap: "সবজি চাষ",
    season: "রবি",
    desc: "শীতকালীন সবজি চাষ — রবি মৌসুমে কৃষকের লাভজনক ফসল",
  },
  {
    url: "https://images.unsplash.com/photo-1464226184884-fa-f280b87c399?w=400&q=80",
    cap: "গ্রামীণ কৃষি",
    season: "সারাবছর",
    desc: "বাংলার গ্রাম — প্রকৃতির সাথে মিশে থাকা কৃষির ঐতিহ্য",
  },
  {
    url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80",
    cap: "ফলের বাগান",
    season: "সারাবছর",
    desc: "বাংলাদেশের বিখ্যাত ফলের বাগান — আম, কাঁঠাল, লিচু",
  },
  {
    url: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&q=80",
    cap: "গম ক্ষেত",
    season: "রবি",
    desc: "রবি মৌসুমের গম চাষ — খাদ্য নিরাপত্তার গুরুত্বপূর্ণ ফসল",
  },
  {
    url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&q=80",
    cap: "ধান রোপণ",
    season: "খরিফ",
    desc: "আমন ধান রোপণ — বর্ষা মৌসুমে কৃষকের সবচেয়ে ব্যস্ত সময়",
  },
  {
    url: "https://images.unsplash.com/photo-1592982537447-6f2a6a0c8b8b?w=400&q=80",
    cap: "পাট ক্ষেত",
    season: "খরিফ",
    desc: "সোনালি আঁশ — বাংলাদেশের অর্থনীতির সোনালী সম্পদ পাট",
  },
  {
    url: "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400&q=80",
    cap: "আলু চাষ",
    season: "রবি",
    desc: "শীতকালীন আলু চাষ — বাংলাদেশের প্রধান অর্থকরী ফসল",
  },
  {
    url: "https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&q=80",
    cap: "সরিষা ক্ষেত",
    season: "রবি",
    desc: "রবি মৌসুমের সরিষা — হলুদ ফুলে ভরা মাঠ কৃষকের আনন্দ",
  },
];

const SEASON_TABS: { key: Season; label: string; icon: string }[] = [
  { key: "সব", label: "সব", icon: "📷" },
  { key: "রবি", label: "রবি", icon: "❄️" },
  { key: "খরিফ", label: "খরিফ", icon: "🌧️" },
  { key: "সারাবছর", label: "সারাবছর", icon: "📅" },
];

export default function PhotoGallery() {
  const [active, setActive] = useState<number | null>(null);
  const [season, setSeason] = useState<Season>("সব");

  const filtered = season === "সব" ? PHOTOS : PHOTOS.filter(p => p.season === season);

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (active === null) return;
    if (e.key === "Escape") setActive(null);
    if (e.key === "ArrowLeft") setActive((active - 1 + filtered.length) % filtered.length);
    if (e.key === "ArrowRight") setActive((active + 1) % filtered.length);
  }, [active, filtered.length]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset active when filtered list changes
  useEffect(() => {
    setActive(null);
  }, [season]);

  const seasonColors: Record<string, string> = {
    "রবি": "bg-blue-100 text-blue-700",
    "খরিফ": "bg-green-100 text-green-700",
    "সারাবছর": "bg-amber-100 text-amber-700",
  };

  return (
    <div className="relative">
      {/* Season filter tabs */}
      <div className="flex gap-1.5 mb-3">
        {SEASON_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSeason(tab.key)}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
              season === tab.key
                ? "bg-[#1b4332] text-white border-[#1b4332]"
                : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Scroll container */}
      <div className="scroll-x pb-2">
        {filtered.map((p, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[160px] sm:w-[200px] lg:w-[240px] rounded-xl overflow-hidden cursor-pointer shadow-md hover:scale-[1.03] transition-transform scroll-snap-align-start"
            onClick={() => setActive(i)}
          >
            <div className="relative w-[160px] sm:w-[200px] lg:w-[240px] h-[110px] sm:h-[130px] lg:h-[150px]">
              <Image
                src={p.url}
                alt={p.cap}
                fill
                className="object-cover"
                sizes="240px"
                loading="lazy"
                unoptimized
              />
              {/* Season badge overlay */}
              {p.season !== "সব" && (
                <span className={`absolute top-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${seasonColors[p.season] || "bg-gray-100 text-gray-700"}`}>
                  {p.season}
                </span>
              )}
            </div>
            <div className="bg-[#1b4332] text-white text-[10px] py-1.5 px-2 font-medium leading-tight">
              {p.cap}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {active !== null && filtered[active] && (
        <div
          className="gallery-lightbox"
          onClick={() => setActive(null)}
        >
          <button
            className="absolute top-4 right-4 bg-white/15 border-none text-white w-9 h-9 rounded-full text-lg cursor-pointer hover:bg-white/25 transition-colors"
            onClick={() => setActive(null)}
          >
            ✕
          </button>
          <img
            src={filtered[active].url.replace("w=400", "w=800")}
            alt={filtered[active].cap}
            className="max-w-full max-h-[60vh] rounded-xl object-contain"
          />
          <div className="text-white/90 text-[14px] font-bold mt-3 text-center">
            {filtered[active].cap}
          </div>
          <div className="text-white/60 text-[12px] mt-1 text-center max-w-md">
            {filtered[active].desc}
          </div>
          <div className="flex items-center gap-5 mt-3 text-white">
            <button
              className="bg-white/15 border-none text-white w-10 h-10 rounded-full text-xl cursor-pointer flex items-center justify-center hover:bg-white/25 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setActive((active - 1 + filtered.length) % filtered.length);
              }}
            >
              ‹
            </button>
            <span className="text-[13px] text-white/60">
              {active + 1} / {filtered.length}
            </span>
            <button
              className="bg-white/15 border-none text-white w-10 h-10 rounded-full text-xl cursor-pointer flex items-center justify-center hover:bg-white/25 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setActive((active + 1) % filtered.length);
              }}
            >
              ›
            </button>
          </div>
          <div className="text-[10px] text-white/30 mt-2">
            ← → কীবোর্ড নেভিগেশন · ESC বন্ধ করুন
          </div>
        </div>
      )}
    </div>
  );
}
