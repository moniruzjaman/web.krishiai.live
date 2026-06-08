"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { DiagnosisImageEntry } from "@/lib/diseaseImages";

type Season = "সব" | "রবি" | "খরিফ" | "সারাবছর";
type GalleryTab = "photos" | "diagnosis";

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

const TAB_BAR: { key: GalleryTab; label: string; icon: string }[] = [
  { key: "photos", label: "ছবি", icon: "📸" },
  { key: "diagnosis", label: "রোগের ছবি", icon: "🔬" },
];

const DIAGNOSIS_TYPE_TABS: { key: DiagnosisImageEntry["type"] | "all"; label: string; icon: string }[] = [
  { key: "all", label: "সব", icon: "📊" },
  { key: "disease", label: "রোগ", icon: "🦠" },
  { key: "deficiency", label: "ঘাটতি", icon: "⚗️" },
  { key: "pest", label: "পোকা", icon: "🐛" },
];

export default function PhotoGallery() {
  const [active, setActive] = useState<number | null>(null);
  const [season, setSeason] = useState<Season>("সব");
  const [tab, setTab] = useState<GalleryTab>("photos");
  const [diagImages, setDiagImages] = useState<DiagnosisImageEntry[]>([]);
  const [diagType, setDiagType] = useState<DiagnosisImageEntry["type"] | "all">("all");
  const [loading, setLoading] = useState(false);

  const filtered = season === "সব" ? PHOTOS : PHOTOS.filter(p => p.season === season);

  useEffect(() => {
    if (tab !== "diagnosis" || diagImages.length > 0) return;
    setLoading(true);
    fetch("/images/diagnosis-index.json")
      .then((r) => r.json())
      .then((data) => setDiagImages(data.images || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, diagImages.length]);

  const diagFiltered = diagType === "all"
    ? diagImages
    : diagImages.filter((img) => img.type === diagType);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (active === null) return;
    if (e.key === "Escape") setActive(null);
    const list = tab === "photos" ? filtered : diagFiltered;
    if (e.key === "ArrowLeft") setActive((active - 1 + list.length) % list.length);
    if (e.key === "ArrowRight") setActive((active + 1) % list.length);
  }, [active, filtered.length, diagFiltered.length, tab]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setActive(null);
  }, [season, diagType, tab]);

  const seasonColors: Record<string, string> = {
    "রবি": "bg-blue-100 text-blue-700",
    "খরিফ": "bg-green-100 text-green-700",
    "সারাবছর": "bg-amber-100 text-amber-700",
  };

  const activeList = tab === "photos" ? filtered : diagFiltered;

  return (
    <div className="relative">
      {/* Tab bar */}
      <div className="flex gap-1.5 mb-3">
        {TAB_BAR.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setActive(null); }}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
              tab === t.key
                ? "bg-[#1b4332] text-white border-[#1b4332]"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-green-300"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Sub-tabs for diagnosis */}
      {tab === "diagnosis" && (
        <div className="flex gap-1.5 mb-3">
          {DIAGNOSIS_TYPE_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setDiagType(t.key); setActive(null); }}
              className={`text-[9px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                diagType === t.key
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-amber-300"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Season filter for photos tab */}
      {tab === "photos" && (
        <div className="flex gap-1.5 mb-3">
          {SEASON_TABS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSeason(s.key)}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                season === s.key
                  ? "bg-[#1b4332] text-white border-[#1b4332]"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-green-300"
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Scroll container */}
      <div className="scroll-x pb-2">
        {loading && (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        )}

        {!loading && tab === "diagnosis" && diagFiltered.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-xs">
            কোনো ছবি পাওয়া যায়নি
          </div>
        )}

        {tab === "photos" && filtered.map((p, i) => (
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

        {tab === "diagnosis" && diagFiltered.map((img, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[160px] sm:w-[200px] lg:w-[240px] rounded-xl overflow-hidden cursor-pointer shadow-md hover:scale-[1.03] transition-transform scroll-snap-align-start"
            onClick={() => setActive(i)}
          >
            <div className="relative w-[160px] sm:w-[200px] lg:w-[240px] h-[110px] sm:h-[130px] lg:h-[150px]">
              <img
                src={img.src}
                alt={img.condition || img.typeLabel}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <span className={`absolute top-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                img.type === "disease" ? "bg-red-100 text-red-700" :
                img.type === "deficiency" ? "bg-amber-100 text-amber-700" :
                "bg-purple-100 text-purple-700"
              }`}>
                {img.typeLabel}
              </span>
              {img.crop && (
                <span className="absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                  {img.crop}
                </span>
              )}
            </div>
            <div className="bg-[#1b4332] text-white text-[9px] py-1.5 px-2 font-medium leading-tight truncate">
              {img.condition || img.typeLabel}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {active !== null && activeList[active] && (
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
          {tab === "photos" ? (
            <>
              <img
                src={(activeList[active] as Photo).url.replace("w=400", "w=800")}
                alt={(activeList[active] as Photo).cap}
                className="max-w-full max-h-[60vh] rounded-xl object-contain"
              />
              <div className="text-white/90 text-[14px] font-bold mt-3 text-center">
                {(activeList[active] as Photo).cap}
              </div>
              <div className="text-white/60 text-[12px] mt-1 text-center max-w-md">
                {(activeList[active] as Photo).desc}
              </div>
            </>
          ) : (
            <>
              <img
                src={(activeList[active] as DiagnosisImageEntry).src}
                alt={(activeList[active] as DiagnosisImageEntry).condition || ""}
                className="max-w-full max-h-[60vh] rounded-xl object-contain"
              />
              <div className="text-white/90 text-[14px] font-bold mt-3 text-center">
                {(activeList[active] as DiagnosisImageEntry).condition || (activeList[active] as DiagnosisImageEntry).typeLabel}
              </div>
              <div className="flex gap-2 mt-1 justify-center">
                <span className="text-[10px] font-bold bg-white/20 text-white/90 px-2 py-0.5 rounded-full">
                  {(activeList[active] as DiagnosisImageEntry).typeLabel}
                </span>
                {(activeList[active] as DiagnosisImageEntry).crop && (
                  <span className="text-[10px] font-bold bg-white/20 text-white/90 px-2 py-0.5 rounded-full">
                    {(activeList[active] as DiagnosisImageEntry).crop}
                  </span>
                )}
              </div>
            </>
          )}
          <div className="flex items-center gap-5 mt-3 text-white">
            <button
              className="bg-white/15 border-none text-white w-10 h-10 rounded-full text-xl cursor-pointer flex items-center justify-center hover:bg-white/25 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setActive((active - 1 + activeList.length) % activeList.length);
              }}
            >
              ‹
            </button>
            <span className="text-[13px] text-white/60">
              {active + 1} / {activeList.length}
            </span>
            <button
              className="bg-white/15 border-none text-white w-10 h-10 rounded-full text-xl cursor-pointer flex items-center justify-center hover:bg-white/25 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setActive((active + 1) % activeList.length);
              }}
            >
              ›
            </button>
          </div>
          <div className="text-[10px] text-white/30 mt-2">
            ← → কীবোর্ড · ESC বন্ধ
          </div>
        </div>
      )}
    </div>
  );
}
