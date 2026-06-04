"use client";

/**
 * Crop Library — Enhanced with Detailed Expandable Crop Info
 *
 * Features:
 * - 20+ crops with detailed information
 * - Expandable cards with cultivation guide
 * - Season filter
 * - Search functionality
 * - BARI/BRRI variety info
 * - Disease & pest info per crop
 */

import { useState, useMemo } from "react";

// ── Crop database ────────────────────────────────────────────────────────────
const CROPS = [
  {
    icon: "🌾", name: "ধান (বোরো)", season: "রবি", region: "সর্বজনীন",
    variety: ["ব্রি ধান-২৮", "ব্রি ধান-২৯", "ব্রি ধান-৫০", "ব্রি ধান-৮৪"],
    duration: "১৪০-১৬০ দিন", yieldPer: "৪.৫-৬.০ টন/হেক্টর",
    seedRate: "৩৫-৪০ কেজি/হেক্টর", spacing: "২০×১৫ সেমি",
    fertilizer: "ইউরিয়া ২২০, টিএসপি ১৫০, এমওপি ১০০, জিপসাম ৫৫ কেজি/হেক্টর",
    diseases: ["ব্লাস্ট", "খোল পোড়া", "ব্যাকটেরিয়াল লিফ ব্লাইট", "টাংগ্রো"],
    pests: ["বাদামি গাছফড়িং", "গণ্ডারি", "হিসপা", "লেফ ফোল্ডার"],
    tips: "বীজতলায় সুস্থ চারা তৈরি করুন। সময়মতো সার প্রয়োগ ও সেচ ব্যবস্থাপনা করুন। ফেয়ারি সেচ (AWD) পদ্ধতি ব্যবহার করুন।",
  },
  {
    icon: "🌾", name: "ধান (আমন)", season: "খরিফ", region: "সর্বজনীন",
    variety: ["ব্রি ধান-৩৩", "ব্রি ধান-৪৯", "ব্রি ধান-৬২", "ব্রি ধান-৮৭"],
    duration: "১২০-১৪০ দিন", yieldPer: "৩.০-৪.৫ টন/হেক্টর",
    seedRate: "৪০-৪৫ কেজি/হেক্টর", spacing: "২০×১৫ সেমি",
    fertilizer: "ইউরিয়া ১৮০, টিএসপি ১১০, এমওপি ৮৫, জিপসাম ৪৫ কেজি/হেক্টর",
    diseases: ["ব্লাস্ট", "খোল পোড়া", "ফলছিদ্র", "ব্যাকটেরিয়াল ব্লাইট"],
    pests: ["গাছফড়িং", "গণ্ডারি", "হিসপা", "মাজরা"],
    tips: "বর্ষার শুরুতেই রোপণ সম্পন্ন করুন। পানি নিষ্কাশন ব্যবস্থা নিশ্চিত করুন।",
  },
  {
    icon: "🌾", name: "গম", season: "রবি", region: "দিনাজপুর, রাজশাহী, যশোর",
    variety: ["ব্রি গম-২৬", "ব্রি গম-৩৩", "প্রোবিড", "শতবার্ষিকী"],
    duration: "১১০-১২০ দিন", yieldPer: "৩.০-৪.৫ টন/হেক্টর",
    seedRate: "১২০ কেজি/হেক্টর", spacing: "লাইনে ২০ সেমি",
    fertilizer: "ইউরিয়া ১৯৫, টিএসপি ১৬৫, এমওপি ১১০, জিপসাম ৬০ কেজি/হেক্টর",
    diseases: ["পাউডারি মিলডিউ", "লিফ রাস্ট", "ব্লাস্ট", "সেপ্টোরিয়া লিফ স্পট"],
    pests: ["আফিড", "থ্রিপস", "কাটওয়ার্ম"],
    tips: "সময়মতো বপন (নভেম্বর ১-৩০)। ২-৩ বার সেচ দিন। ক্রাউন রুট ও ফ্ল্যাগ লিফ পর্যায়ে সেচ বিশেষভাবে গুরুত্বপূর্ণ।",
  },
  {
    icon: "🥔", name: "আলু", season: "রবি", region: "রংপুর, বগুড়া, দিনাজপুর",
    variety: ["ডায়মন্ড", "কারডিনাল", "গ্রানুলা", "আলুরাজ"],
    duration: "৮৫-১০০ দিন", yieldPer: "২০-৩০ টন/হেক্টর",
    seedRate: "১৫০০-১৭০০ কেজি/হেক্টর", spacing: "৬০×২০ সেমি",
    fertilizer: "ইউরিয়া ২৭০, টিএসপি ২৪০, এমওপি ১৮০, জিপসাম ৭৫ কেজি/হেক্টর",
    diseases: ["লেট ব্লাইট", "আর্লি ব্লাইট", "ব্ল্যাক সার্ফ", "স্ক্যাব"],
    pests: ["আলু মাছি", "অ্যাফিড", "হোয়াইট গ্রাব", "কাটওয়ার্ম"],
    tips: "অঙ্কুরোদ্গম করা বীজ ব্যবহার করুন। মালচিং করুন। ব্লাইট প্রতিরোধে সময়মতো ছত্রাকনাশক স্প্রে করুন।",
  },
  {
    icon: "🧅", name: "পেঁয়াজ", season: "রবি", region: "ফরিদপুর, পাবনা, কুষ্টিয়া",
    variety: ["বারি পেঁয়াজ-১", "বারি পেঁয়াজ-৪", "তাহেরপুরী", "জাফ্রি"],
    duration: "৯০-১১০ দিন", yieldPer: "১২-১৮ টন/হেক্টর",
    seedRate: "৫-৭ কেজি বীজ/হেক্টর", spacing: "১৫×১০ সেমি",
    fertilizer: "ইউরিয়া ১৯৫, টিএসপি ১৫০, এমওপি ১২০, জিপসাম ৫৫ কেজি/হেক্টর",
    diseases: ["পারপ্লে ব্লচ", "ডাউনি মিলডিউ", "ব্যাকটেরিয়াল সফট রট"],
    pests: ["থ্রিপস", "অ্যালিয়াম ফ্লাই", "কাটওয়ার্ম"],
    tips: "বীজতলা থেকে চারা রোপণ। কন্দ গঠনের সময় নিয়মিত সেচ। ফসল কাটার ১০ দিন আগে সেচ বন্ধ।",
  },
  {
    icon: "🧄", name: "রসুন", season: "রবি", region: "রংপুর, দিনাজপুর, রাজশাহী",
    variety: ["বারি রসুন-১", "বারি রসুন-২", "স্থানীয় জাত"],
    duration: "১২০-১৩৫ দিন", yieldPer: "৫-৮ টন/হেক্টর",
    seedRate: "৫০০-৬০০ কেজি/হেক্টর", spacing: "১৫×১০ সেমি",
    fertilizer: "ইউরিয়া ১৬৫, টিএসপি ১৩৫, এমওপি ১০০, জিপসাম ৪৫ কেজি/হেক্টর",
    diseases: ["পারপ্লে ব্লচ", "স্টেমফিলিয়াম ব্লাইট", "হোয়াইট রট"],
    pests: ["থ্রিপস", "বালভার্ম", "নিমাটোড"],
    tips: "কাঁচা রসুনের কোয়া বীজ হিসেবে ব্যবহার। মালচিং করুন। স্প্রে সেচ দিন।",
  },
  {
    icon: "🌶️", name: "মরিচ", season: "খরিফ/রবি", region: "বগুড়া, রংপুর, নোয়াখালী",
    variety: ["বারি মরিচ-১", "বারি মরিচ-২", "বালাদেশী মরিচ", "হাইব্রিড"],
    duration: "১৫০-১৮০ দিন", yieldPer: "শুকনো ১.৫-২.৫ টন/হেক্টর",
    seedRate: "৪-৫ কেজি/হেক্টর", spacing: "৬০×৪৫ সেমি",
    fertilizer: "ইউরিয়া ১৬৫, টিএসপি ১৩৫, এমওপি ১০৫, জিপসাম ৪৫ কেজি/হেক্টর",
    diseases: ["অ্যানথ্রাকনোজ", "ফলপচা", "পাতার দাগ", "মোজাইক"],
    pests: ["মরিচ মাছি", "অ্যাফিড", "মাইট", "থ্রিপস"],
    tips: "বীজতলায় চারা তৈরি করুন। ফল ধরার পর নিয়মিত সেচ ও সার দিন।",
  },
  {
    icon: "🍅", name: "টমেটো", season: "রবি", region: "সর্বজনীন",
    variety: ["বারি টমেটো-১৪", "বারি টমেটো-১৫", "রোমা", "হাইব্রিড"],
    duration: "৯০-১১০ দিন", yieldPer: "১৮-৩০ টন/হেক্টর",
    seedRate: "৫০০ গ্রাম/হেক্টর", spacing: "৬০×৪০ সেমি",
    fertilizer: "ইউরিয়া ২১০, টিএসপি ১৬৫, এমওপি ১৩৫, জিপসাম ৪৫ কেজি/হেক্টর",
    diseases: ["ব্যাকটেরিয়াল উইল্ট", "আর্লি ব্লাইট", "লিফ কার্ল", "ফল পচা"],
    pests: ["ফল ছিদ্রকারী", "হোয়াইট ফ্লাই", "অ্যাফিড", "মাইট"],
    tips: "বেলে দোআঁশ মাটি সবচেয়ে ভালো। মাচা তৈরি করুন। সময়মতো ফল সংগ্রহ করুন।",
  },
  {
    icon: "🫚", name: "আদা", season: "খরিফ", region: "রাঙ্গামাটি, খাগড়াছড়ি, বান্দরবান",
    variety: ["বারি আদা-১", "বারি আদা-২", "স্থানীয় জাত"],
    duration: "২১০-২৪০ দিন", yieldPer: "১৫-২৫ টন/হেক্টর",
    seedRate: "২০০০-২৫০০ কেজি/হেক্টর", spacing: "৪৫×২০ সেমি",
    fertilizer: "ইউরিয়া ২৪০, টিএসপি ১৮০, এমওপি ১৩৫, জিপসাম ৬০ কেজি/হেক্টর",
    diseases: ["রাইজোম রট", "লিফ স্পট", "ফুসারিয়াম উইল্ট"],
    pests: ["শুট বোরার", "রাইজোম ফ্লাই", "হোয়াইট গ্রাব"],
    tips: "ছায়াযুক্ত জায়গায় চাষ করুন। মালচিং করুন। জৈব সার বেশি দিন।",
  },
  {
    icon: "🌽", name: "ভুট্টা", season: "খরিফ/রবি", region: "লাক্ষ্মীপুর, নোয়াখালী, বগুড়া",
    variety: ["বারি ভুট্টা-৭", "বারি ভুট্টা-৯", "হাইব্রিড ভুট্টা"],
    duration: "৯৫-১১০ দিন", yieldPer: "৫-৮ টন/হেক্টর",
    seedRate: "২০-২৫ কেজি/হেক্টর", spacing: "৬০×২০ সেমি",
    fertilizer: "ইউরিয়া ২৫৫, টিএসপি ১৯৫, এমওপি ১৫০, জিপসাম ৬০ কেজি/হেক্টর",
    diseases: ["ব্লাইট", "দাগ রোগ", "স্মাট", "রাস্ট"],
    pests: ["ফলন্দার পোকা", "আর্মিওয়ার্ম", "স্টেম বোরার"],
    tips: "হাইব্রিড জাত ব্যবহার করুন। সঠিক সময়ে বপন। ৩-৪ টি সেচ দিন।",
  },
  {
    icon: "🪢", name: "পাট", season: "খরিফ", region: "ফরিদপুর, টাঙ্গাইল, যশোর",
    variety: ["বিজেআরআই তোষা-৮", "ও-৯৮৯৭", "বিজেআরআই দেশী-৭"],
    duration: "১২০-১৪০ দিন", yieldPer: "২.৫-৩.৫ টন আঁশ/হেক্টর",
    seedRate: "৫-৭ কেজি/হেক্টর", spacing: "৩০×৫ সেমি (লাইনে)",
    fertilizer: "ইউরিয়া ১৩৫, টিএসপি ১০৫, এমওপি ৭৫, জিপসাম ৩৫ কেজি/হেক্টর",
    diseases: ["মোজাইক", "স্টেম রট", "অ্যানথ্রাকনোজ", "ব্লাইট"],
    pests: ["সেমিলুপার", "জাব পোকা", "হিসপা", "মাজরা"],
    tips: "আগাছা পরিষ্কার রাখুন। সময়মতো পাট কাটুন। ভালো পানিতে পচান।",
  },
  {
    icon: "🌻", name: "সরিষা", season: "রবি", region: "রাজশাহী, যশোর, চাঁপাইনবাবগঞ্জ",
    variety: ["ব্রি সরিষা-১৪", "ব্রি সরিষা-১৫", "তোরি-৭"],
    duration: "৮০-৯৫ দিন", yieldPer: "১.০-১.৫ টন/হেক্টর",
    seedRate: "৬-৮ কেজি/হেক্টর", spacing: "৩০×১০ সেমি",
    fertilizer: "ইউরিয়া ১৬৫, টিএসপি ১৫০, এমওপি ৯০, জিপসাম ৬০ কেজি/হেক্টর",
    diseases: ["অ্যালটারনেরিয়া ব্লাইট", "হোয়াইট রাস্ট", "স্ক্লেরোটিনিয়া রট"],
    pests: ["মাজরা", "সরিষার স্পটেড বিটল", "ডায়মন্ড ব্যাক মথ"],
    tips: "সময়মতো বপন (অক্টোবর-নভেম্বর)। ফুল আসার সময় সেচ দিন। মাজরা দমনে সতর্ক থাকুন।",
  },
  {
    icon: "🫘", name: "ডাল (মসুর)", season: "রবি", region: "রাজশাহী, চাঁপাইনবাবগঞ্জ, যশোর",
    variety: ["বারি মসুর-৬", "বারি মসুর-৭", "বিনা মসুর-৫"],
    duration: "৯৫-১১০ দিন", yieldPer: "১.০-১.৫ টন/হেক্টর",
    seedRate: "৩০-৩৫ কেজি/হেক্টর", spacing: "৩০×৫ সেমি",
    fertilizer: "ইউরিয়া ৪৫, টিএসপি ১২০, এমওপি ৬০, জিপসাম ৪৫ কেজি/হেক্টর",
    diseases: ["রাস্ট", "অ্যানথ্রাকনোজ", "স্টেমফিলিয়াম ব্লাইট"],
    pests: ["অ্যাফিড", "পড বোরার", "কাটওয়ার্ম"],
    tips: "শস্যের সাথে মিশ্র চাষ করতে পারেন। রাইজোবিয়াম ইনোকুলেন্ট বীজে প্রয়োগ করুন।",
  },
  {
    icon: "🥬", name: "বাঁধাকপি", season: "রবি", region: "সর্বজনীন",
    variety: ["বারি বাঁধাকপি-১", "বারি বাঁধাকপি-২", "হাইব্রিড"],
    duration: "৯০-১১০ দিন", yieldPer: "৩০-৪৫ টন/হেক্টর",
    seedRate: "৩০০-৪০০ গ্রাম/হেক্টর", spacing: "৬০×৪৫ সেমি",
    fertilizer: "ইউরিয়া ২৭০, টিএসপি ১৮০, এমওপি ১৩৫, জিপসাম ৪৫ কেজি/হেক্টর",
    diseases: ["ব্ল্যাক রট", "ক্লাব রুট", "ডাউনি মিলডিউ"],
    pests: ["ডায়মন্ড ব্যাক মথ", "ক্যাবেজ হেড বোরার", "অ্যাফিড"],
    tips: "বীজতলায় চারা তৈরি। মাথা গঠনের সময় প্রচুর পানি দিন।",
  },
  {
    icon: "🥒", name: "শসা", season: "খরিফ/রবি", region: "সর্বজনীন",
    variety: ["বারি শসা-১", "বারি শসা-২", "হাইব্রিড"],
    duration: "৬০-৭৫ দিন", yieldPer: "১৫-২৫ টন/হেক্টর",
    seedRate: "৩-৪ কেজি/হেক্টর", spacing: "১৫০×৬০ সেমি",
    fertilizer: "ইউরিয়া ১৮০, টিএসপি ১৫০, এমওপি ১২০, জিপসাম ৪৫ কেজি/হেক্টর",
    diseases: ["ডাউনি মিলডিউ", "পাউডারি মিলডিউ", "মোজাইক"],
    pests: ["ফল মাছি", "অ্যাফিড", "রেড স্পাইডার মাইট"],
    tips: "মাচা তৈরি করলে ফলন বেশি হয়। মৌ চাষের সাথে মিলিত ফলন।",
  },
  {
    icon: "🍉", name: "তরমুজ", season: "খরিফ", region: "যশোর, কুষ্টিয়া, চাঁপাইনবাবগঞ্জ",
    variety: ["বারি তরমুজ-১", "বারি তরমুজ-২", "হাইব্রিড"],
    duration: "৮৫-১০০ দিন", yieldPer: "২০-৩৫ টন/হেক্টর",
    seedRate: "২.৫-৩ কেজি/হেক্টর", spacing: "২০০×১৫০ সেমি",
    fertilizer: "ইউরিয়া ১৬৫, টিএসপি ১৩৫, এমওপি ১০৫, জিপসাম ৪৫ কেজি/হেক্টর",
    diseases: ["ডাউনি মিলডিউ", "অ্যানথ্রাকনোজ", "ফুসারিয়াম উইল্ট"],
    pests: ["ফল মাছি", "অ্যাফিড", "রেড পাম্পকিন বিটল"],
    tips: "বেলে মাটি সবচেয়ে ভালো। ফল ধরার পর সেচ কমান।",
  },
];

// ── Season filter options ────────────────────────────────────────────────────
const SEASONS = ["সব", "রবি", "খরিফ", "খরিফ/রবি"];

export default function CropLibraryPage() {
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);
  const [seasonFilter, setSeasonFilter] = useState("সব");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return CROPS.filter((c) => {
      const matchSeason = seasonFilter === "সব" || c.season === seasonFilter || c.season.includes(seasonFilter);
      const matchSearch = search === "" || c.name.includes(search) || c.region.includes(search);
      return matchSeason && matchSearch;
    });
  }, [seasonFilter, search]);

  const bn = (n: number | string) =>
    String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="relative px-4 pt-5 pb-7" style={{ background: "linear-gradient(135deg,#166534,#14532d)" }}>
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">CROP LIBRARY</div>
        <h1 className="text-[22px] font-bold text-white mb-1">🌾 শস্য তথ্যভাণ্ডার</h1>
        <p className="text-xs text-white/70">{bn(CROPS.length)}+ ফসলের বিস্তারিত চাষ পদ্ধতি — BARI/BRRI ভিত্তিক</p>
      </div>

      <div className="px-4 pt-5 pb-24">
        {/* Search */}
        <div className="mb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 ফসলের নাম বা এলাকা দিয়ে খুঁজুন..."
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400/30"
          />
        </div>

        {/* Season filter */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none">
          {SEASONS.map((s) => (
            <button
              key={s}
              onClick={() => setSeasonFilter(s)}
              className={`whitespace-nowrap text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                seasonFilter === s
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-green-300"
              }`}
            >
              {s === "সব" ? "📊" : s === "রবি" ? "❄️" : "🌧️"} {s}
            </button>
          ))}
        </div>

        {/* Crop count */}
        <div className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">{bn(filtered.length)} টি ফসল পাওয়া গেছে</div>

        {/* Crop cards */}
        <div className="space-y-2.5">
          {filtered.map((crop, i) => {
            const isExpanded = expandedCrop === crop.name;
            return (
              <div
                key={i}
                className={`rounded-xl border-2 transition-all overflow-hidden ${
                  isExpanded ? "border-green-400 bg-green-50/30" : "border-gray-200 dark:border-gray-700 bg-white hover:border-green-300"
                }`}
              >
                {/* Collapsed view */}
                <button
                  onClick={() => setExpandedCrop(isExpanded ? null : crop.name)}
                  className="w-full flex items-center gap-3 p-3.5 cursor-pointer text-left bg-transparent border-none"
                >
                  <div className="text-2xl">{crop.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{crop.name}</div>
                    <div className="flex gap-1.5 mt-0.5 flex-wrap">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        crop.season === "রবি" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                      }`}>
                        {crop.season}
                      </span>
                      <span className="text-[9px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">📍 {crop.region}</span>
                      <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⏱️ {crop.duration}</span>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold transition-transform ${isExpanded ? "text-green-600 rotate-90" : "text-gray-400 dark:text-gray-500"}`}>
                    ▶
                  </span>
                </button>

                {/* Expanded view */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {/* Varieties */}
                    <div>
                      <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">🌱 উন্নত জাত</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {crop.variety.map((v, j) => (
                          <span key={j} className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{v}</span>
                        ))}
                      </div>
                    </div>

                    {/* Key stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-green-100">
                        <div className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">ফলন</div>
                        <div className="text-[12px] font-bold text-gray-900 dark:text-gray-100">{crop.yieldPer}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-green-100">
                        <div className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">বীজের হার</div>
                        <div className="text-[12px] font-bold text-gray-900 dark:text-gray-100">{crop.seedRate}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-green-100">
                        <div className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">দূরত্ব</div>
                        <div className="text-[12px] font-bold text-gray-900 dark:text-gray-100">{crop.spacing}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-green-100">
                        <div className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">মেয়াদ</div>
                        <div className="text-[12px] font-bold text-gray-900 dark:text-gray-100">{crop.duration}</div>
                      </div>
                    </div>

                    {/* Fertilizer */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                      <div className="text-[11px] font-bold text-amber-900 mb-1">🧪 সারের মাত্রা (প্রতি হেক্টর)</div>
                      <div className="text-[10px] text-amber-800 leading-relaxed">{crop.fertilizer}</div>
                    </div>

                    {/* Diseases */}
                    <div>
                      <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">🍄 প্রধান রোগ</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {crop.diseases.map((d, j) => (
                          <span key={j} className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{d}</span>
                        ))}
                      </div>
                    </div>

                    {/* Pests */}
                    <div>
                      <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">🪲 প্রধান কীটপতঙ্গ</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {crop.pests.map((p, j) => (
                          <span key={j} className="text-[9px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">{p}</span>
                        ))}
                      </div>
                    </div>

                    {/* Tips */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
                      <div className="text-[11px] font-bold text-green-900 mb-1">💡 চাষের টিপস</div>
                      <div className="text-[10px] text-green-800 leading-relaxed">{crop.tips}</div>
                    </div>

                    {/* Action links */}
                    <div className="flex gap-2">
                      <a
                        href={`/tools/soil`}
                        className="text-[10px] font-bold text-pink-700 bg-pink-100 border border-pink-200 rounded-full px-3 py-1.5 no-underline hover:bg-pink-200 transition-colors"
                      >
                        🏺 সার ক্যালকুলেটর
                      </a>
                      <a
                        href={`/tools/pesticide`}
                        className="text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 rounded-full px-3 py-1.5 no-underline hover:bg-red-200 transition-colors"
                      >
                        🧪 কীটনাশক পরামর্শ
                      </a>
                      <a
                        href={`/chat`}
                        className="text-[10px] font-bold text-green-700 bg-green-100 border border-green-200 rounded-full px-3 py-1.5 no-underline hover:bg-green-200 transition-colors"
                      >
                        🤖 AI থেকে জানুন
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">
            কোনো ফসল পাওয়া যায়নি
          </div>
        )}
      </div>
    </div>
  );
}
