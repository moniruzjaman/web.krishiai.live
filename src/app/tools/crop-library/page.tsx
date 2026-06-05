"use client";

/**
 * Crop Library — AI-Powered Bangladesh Crop Database (Enhanced)
 *
 * Features:
 * - 7 category navigation with horizontal scrollable pills
 * - AI-powered crop data via /api/crop-database
 * - Fallback hardcoded crops shown immediately on Grains tab
 * - Expandable crop cards with full details (soil, climate, economic, uses)
 * - Cultivation areas displayed as tags
 * - Average yield badge
 * - Season filter (রবি/খরিফ)
 * - Search functionality
 * - Per-category caching to avoid re-fetching
 * - Loading skeletons while AI fetches
 * - Error state with retry button
 * - Dark mode support
 * - Mobile-first responsive
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, Search, RefreshCw, BookOpen, FlaskConical, Bug, Bot, Loader2 } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface AICrop {
  id?: string;
  name: string;
  scientificName?: string;
  description?: string;
  cultivationAreas?: string[] | string;
  soilRequirements?: string;
  climateRequirements?: string;
  averageYield?: string;
  economicImportance?: string;
  commonUses?: string[] | string;
  season?: string;
  icon?: string;
  category?: string;
}

interface HardcodedCrop {
  icon: string;
  name: string;
  season: string;
  region: string;
  variety: string[];
  duration: string;
  yieldPer: string;
  seedRate: string;
  spacing: string;
  fertilizer: string;
  diseases: string[];
  pests: string[];
  tips: string;
}

// ── Category definitions ─────────────────────────────────────────────────────
const CROP_CATEGORIES = [
  { name: "শস্য", value: "Grains", icon: "🌾" },
  { name: "তেল বীজ", value: "Oils", icon: "🫒" },
  { name: "মসলা", value: "Spices", icon: "🌶️" },
  { name: "ডাল", value: "Pulses", icon: "🫘" },
  { name: "ফল", value: "Fruits", icon: "🥭" },
  { name: "সবজি", value: "Vegetables", icon: "🥬" },
  { name: "উচ্চমূল্যের ফসল", value: "High Value Crops", icon: "💰" },
];

// ── Season filter options ────────────────────────────────────────────────────
const SEASONS = ["সব", "রবি", "খরিফ", "খরিফ/রবি"];

// ── Hardcoded fallback crops (Grains — shown immediately) ───────────────────
const HARDCODED_CROPS: HardcodedCrop[] = [
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
];

// ── Bengali number helper ────────────────────────────────────────────────────
const bn = (n: number | string) =>
  String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

// ── Helper: normalize cultivationAreas to string[] ───────────────────────────
function normalizeAreas(areas: string[] | string | undefined): string[] {
  if (!areas) return [];
  if (Array.isArray(areas)) return areas;
  // Split comma-separated string
  return areas.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
}

// ── Helper: normalize commonUses to string[] ─────────────────────────────────
function normalizeUses(uses: string[] | string | undefined): string[] {
  if (!uses) return [];
  if (Array.isArray(uses)) return uses;
  return uses.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
}

// ── Helper: truncate text ────────────────────────────────────────────────────
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trim() + "...";
}

// ── Helper: season badge color ───────────────────────────────────────────────
function seasonColor(season: string) {
  if (season === "রবি") return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400";
  if (season === "খরিফ") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400";
}

// ── Skeleton card component ──────────────────────────────────────────────────
function SkeletonCards() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
          <div className="mt-3 flex gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Unified Crop Card (handles both hardcoded & AI data) ─────────────────────
function CropCard({
  crop,
  isExpanded,
  onToggle,
  isAiData,
}: {
  crop: AICrop;
  isExpanded: boolean;
  onToggle: () => void;
  isAiData: boolean;
}) {
  const areas = normalizeAreas(crop.cultivationAreas);
  const uses = normalizeUses(crop.commonUses);

  return (
    <div
      className={`rounded-xl border-2 transition-all overflow-hidden shadow-sm ${
        isExpanded
          ? "border-green-400 dark:border-green-600 bg-green-50/30 dark:bg-green-900/10 shadow-md shadow-green-100 dark:shadow-green-900/20"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md"
      }`}
    >
      {/* Collapsed view */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 cursor-pointer text-left bg-transparent border-none"
      >
        <div className="text-2xl w-11 h-11 flex items-center justify-center bg-green-50 dark:bg-green-900/20 rounded-xl flex-shrink-0">
          {crop.icon || "🌱"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-gray-900 dark:text-gray-100">
              {crop.name}
            </span>
            {isAiData && (
              <span className="text-[7px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-bold tracking-wide">
                AI
              </span>
            )}
          </div>
          {crop.scientificName && (
            <div className="text-[10px] text-gray-500 dark:text-gray-400 italic mt-0.5">
              {crop.scientificName}
            </div>
          )}
          {crop.description && !isExpanded && (
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              {truncate(crop.description, 80)}
            </div>
          )}
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {crop.season && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${seasonColor(crop.season)}`}>
                {crop.season === "রবি" ? "❄️" : crop.season === "খরিফ" ? "🌧️" : "🔄"} {crop.season}
              </span>
            )}
            {crop.averageYield && (
              <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
                📊 {crop.averageYield}
              </span>
            )}
            {areas.length > 0 && !isExpanded && (
              <span className="text-[9px] bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full">
                📍 {areas.slice(0, 2).join(", ")}{areas.length > 2 ? ` +${areas.length - 2}` : ""}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 mt-1 transition-transform duration-200 ${
            isExpanded
              ? "text-green-600 rotate-180"
              : "text-gray-400 dark:text-gray-500"
          }`}
        />
      </button>

      {/* Expanded view */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Description */}
          {crop.description && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                📝 বিবরণ
              </div>
              <div className="text-[10px] text-gray-600 dark:text-gray-300 leading-relaxed">
                {crop.description}
              </div>
            </div>
          )}

          {/* Cultivation Areas as tags */}
          {areas.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                📍 চাষ এলাকা
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {areas.map((area, j) => (
                  <span
                    key={j}
                    className="text-[9px] bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full font-medium"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key info grid */}
          <div className="grid grid-cols-2 gap-2">
            {crop.averageYield && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-green-100 dark:border-green-900/30">
                <div className="text-[9px] text-gray-500 dark:text-gray-400">📊 গড় ফলন</div>
                <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100">
                  {crop.averageYield}
                </div>
              </div>
            )}
            {crop.soilRequirements && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-green-100 dark:border-green-900/30">
                <div className="text-[9px] text-gray-500 dark:text-gray-400">🏺 মাটির ধরন</div>
                <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                  {truncate(crop.soilRequirements, 50)}
                </div>
              </div>
            )}
          </div>

          {/* Soil Requirements (full) */}
          {crop.soilRequirements && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
              <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 mb-1">
                🏺 মাটির প্রয়োজনীয়তা
              </div>
              <div className="text-[10px] text-amber-800 dark:text-amber-400 leading-relaxed">
                {crop.soilRequirements}
              </div>
            </div>
          )}

          {/* Climate Requirements */}
          {crop.climateRequirements && (
            <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg p-2.5">
              <div className="text-[11px] font-bold text-sky-900 dark:text-sky-300 mb-1">
                🌤️ জলবায়ু প্রয়োজনীয়তা
              </div>
              <div className="text-[10px] text-sky-800 dark:text-sky-400 leading-relaxed">
                {crop.climateRequirements}
              </div>
            </div>
          )}

          {/* Economic Importance */}
          {crop.economicImportance && (
            <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-2.5">
              <div className="text-[11px] font-bold text-violet-900 dark:text-violet-300 mb-1">
                💰 অর্থনৈতিক গুরুত্ব
              </div>
              <div className="text-[10px] text-violet-800 dark:text-violet-400 leading-relaxed">
                {crop.economicImportance}
              </div>
            </div>
          )}

          {/* Common Uses */}
          {uses.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                🎯 সাধারণ ব্যবহার
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {uses.map((use, j) => (
                  <span
                    key={j}
                    className="text-[9px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium"
                  >
                    {use}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action links */}
          <div className="flex gap-2 flex-wrap pt-1">
            <a
              href="/tools/soil"
              className="text-[10px] font-bold text-pink-700 bg-pink-100 dark:bg-pink-900/30 dark:text-pink-400 border border-pink-200 dark:border-pink-800 rounded-full px-3 py-1.5 no-underline hover:bg-pink-200 dark:hover:bg-pink-900/40 transition-colors inline-flex items-center gap-1"
            >
              <FlaskConical className="w-3 h-3" />
              সার ক্যালকুলেটর
            </a>
            <a
              href="/tools/pesticide"
              className="text-[10px] font-bold text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-full px-3 py-1.5 no-underline hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors inline-flex items-center gap-1"
            >
              <Bug className="w-3 h-3" />
              কীটনাশক পরামর্শ
            </a>
            <a
              href="/chat"
              className="text-[10px] font-bold text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-full px-3 py-1.5 no-underline hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors inline-flex items-center gap-1"
            >
              <Bot className="w-3 h-3" />
              AI থেকে জানুন
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Hardcoded Crop Card (for Grains fallback) ────────────────────────────────
function HardcodedCropCard({
  crop,
  isExpanded,
  onToggle,
}: {
  crop: HardcodedCrop;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  // Convert region string to area tags
  const areas = crop.region.split(/[,،]/).map((s) => s.trim()).filter(Boolean);

  return (
    <div
      className={`rounded-xl border-2 transition-all overflow-hidden shadow-sm ${
        isExpanded
          ? "border-green-400 dark:border-green-600 bg-green-50/30 dark:bg-green-900/10 shadow-md shadow-green-100 dark:shadow-green-900/20"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md"
      }`}
    >
      {/* Collapsed view */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 cursor-pointer text-left bg-transparent border-none"
      >
        <div className="text-2xl w-11 h-11 flex items-center justify-center bg-green-50 dark:bg-green-900/20 rounded-xl flex-shrink-0">
          {crop.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-gray-900 dark:text-gray-100">
              {crop.name}
            </span>
            <span className="text-[7px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold tracking-wide">
              স্থানীয়
            </span>
          </div>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${seasonColor(crop.season)}`}>
              {crop.season === "রবি" ? "❄️" : crop.season === "খরিফ" ? "🌧️" : "🔄"} {crop.season}
            </span>
            <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
              📊 {crop.yieldPer}
            </span>
            {areas.length > 0 && (
              <span className="text-[9px] bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full">
                📍 {areas.slice(0, 2).join(", ")}{areas.length > 2 ? ` +${areas.length - 2}` : ""}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 mt-1 transition-transform duration-200 ${
            isExpanded
              ? "text-green-600 rotate-180"
              : "text-gray-400 dark:text-gray-500"
          }`}
        />
      </button>

      {/* Expanded view */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Varieties */}
          <div>
            <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              🌱 উন্নত জাত
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {crop.variety.map((v, j) => (
                <span
                  key={j}
                  className="text-[9px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>

          {/* Cultivation Areas as tags */}
          {areas.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                📍 চাষ এলাকা
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {areas.map((area, j) => (
                  <span
                    key={j}
                    className="text-[9px] bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full font-medium"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-green-100 dark:border-green-900/30">
              <div className="text-[9px] text-gray-500 dark:text-gray-400">📊 ফলন</div>
              <div className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
                {crop.yieldPer}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-green-100 dark:border-green-900/30">
              <div className="text-[9px] text-gray-500 dark:text-gray-400">বীজের হার</div>
              <div className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
                {crop.seedRate}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-green-100 dark:border-green-900/30">
              <div className="text-[9px] text-gray-500 dark:text-gray-400">দূরত্ব</div>
              <div className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
                {crop.spacing}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-green-100 dark:border-green-900/30">
              <div className="text-[9px] text-gray-500 dark:text-gray-400">মেয়াদ</div>
              <div className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
                {crop.duration}
              </div>
            </div>
          </div>

          {/* Fertilizer */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
            <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 mb-1">
              🧪 সারের মাত্রা (প্রতি হেক্টর)
            </div>
            <div className="text-[10px] text-amber-800 dark:text-amber-400 leading-relaxed">
              {crop.fertilizer}
            </div>
          </div>

          {/* Diseases */}
          <div>
            <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              🍄 প্রধান রোগ
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {crop.diseases.map((d, j) => (
                <span
                  key={j}
                  className="text-[9px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-medium"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Pests */}
          <div>
            <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              🪲 প্রধান কীটপতঙ্গ
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {crop.pests.map((p, j) => (
                <span
                  key={j}
                  className="text-[9px] bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2.5">
            <div className="text-[11px] font-bold text-green-900 dark:text-green-300 mb-1">
              💡 চাষের টিপস
            </div>
            <div className="text-[10px] text-green-800 dark:text-green-400 leading-relaxed">
              {crop.tips}
            </div>
          </div>

          {/* Action links */}
          <div className="flex gap-2 flex-wrap pt-1">
            <a
              href="/tools/soil"
              className="text-[10px] font-bold text-pink-700 bg-pink-100 dark:bg-pink-900/30 dark:text-pink-400 border border-pink-200 dark:border-pink-800 rounded-full px-3 py-1.5 no-underline hover:bg-pink-200 dark:hover:bg-pink-900/40 transition-colors inline-flex items-center gap-1"
            >
              <FlaskConical className="w-3 h-3" />
              সার ক্যালকুলেটর
            </a>
            <a
              href="/tools/pesticide"
              className="text-[10px] font-bold text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-full px-3 py-1.5 no-underline hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors inline-flex items-center gap-1"
            >
              <Bug className="w-3 h-3" />
              কীটনাশক পরামর্শ
            </a>
            <a
              href="/chat"
              className="text-[10px] font-bold text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-full px-3 py-1.5 no-underline hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors inline-flex items-center gap-1"
            >
              <Bot className="w-3 h-3" />
              AI থেকে জানুন
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page component ──────────────────────────────────────────────────────
export default function CropLibraryPage() {
  const [activeCategory, setActiveCategory] = useState("Grains");
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);
  const [seasonFilter, setSeasonFilter] = useState("সব");
  const [search, setSearch] = useState("");

  // Per-category AI crop data cache
  const [categoryCache, setCategoryCache] = useState<Record<string, AICrop[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if a category has been fetched
  const fetchedRef = useRef<Record<string, boolean>>({});

  // Current category's AI crops
  const aiCrops = categoryCache[activeCategory] || [];

  // Fetch AI crop data when category changes
  const fetchCrops = useCallback(async (category: string) => {
    // Already cached
    if (categoryCache[category]) return;

    const isGrainsFirstLoad = category === "Grains" && !fetchedRef.current[category];
    fetchedRef.current[category] = true;

    if (!isGrainsFirstLoad) {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch(`/api/crop-database?category=${encodeURIComponent(category)}`);
      const data = await res.json();

      if (data.ok && Array.isArray(data.crops) && data.crops.length > 0) {
        setCategoryCache((prev) => ({ ...prev, [category]: data.crops }));
      } else if (!isGrainsFirstLoad) {
        setError(data.error || "তথ্য লোড করা যায়নি");
      }
    } catch {
      if (!isGrainsFirstLoad) {
        setError("নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।");
      }
    } finally {
      setLoading(false);
    }
  }, [categoryCache]);

  // Fetch crops when category changes
  useEffect(() => {
    fetchCrops(activeCategory);
  }, [activeCategory, fetchCrops]);

  // Determine display crops based on category
  const displayCrops = useMemo(() => {
    if (activeCategory === "Grains") {
      if (aiCrops.length > 0) return aiCrops;
      return HARDCODED_CROPS;
    }
    return aiCrops;
  }, [activeCategory, aiCrops]);

  // Filter crops by season and search
  const filtered = useMemo(() => {
    if (activeCategory === "Grains" && aiCrops.length === 0) {
      // Hardcoded crops filtering
      return HARDCODED_CROPS.filter((c) => {
        const matchSeason = seasonFilter === "সব" || c.season === seasonFilter || c.season.includes(seasonFilter);
        const matchSearch = search === "" || c.name.includes(search) || c.region.includes(search);
        return matchSeason && matchSearch;
      });
    }

    // AI crops filtering
    return (displayCrops as AICrop[]).filter((crop) => {
      const matchSeason = seasonFilter === "সব" || crop.season === seasonFilter || (crop.season && crop.season.includes(seasonFilter));
      const matchSearch = search === "" ||
        (crop.name && crop.name.includes(search)) ||
        (crop.scientificName && crop.scientificName.toLowerCase().includes(search.toLowerCase())) ||
        (crop.cultivationAreas && (
          Array.isArray(crop.cultivationAreas)
            ? crop.cultivationAreas.some((a: string) => a.includes(search))
            : crop.cultivationAreas.includes(search)
        )) ||
        (crop.description && crop.description.includes(search));
      return matchSeason && matchSearch;
    });
  }, [activeCategory, aiCrops, displayCrops, seasonFilter, search]);

  // Is this a hardcoded crop view?
  const isHardcodedView = activeCategory === "Grains" && aiCrops.length === 0;

  // Get the active category object
  const activeCat = CROP_CATEGORIES.find((c) => c.value === activeCategory);

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="relative px-4 pt-5 pb-8" style={{ background: "linear-gradient(135deg,#166534,#14532d)" }}>
        <div className="absolute -bottom-px left-0 right-0 h-6 bg-white dark:bg-gray-900 rounded-t-[24px]" />
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-white/40 tracking-[0.2em] font-bold mb-1.5 uppercase">Crop Database</div>
            <h1 className="text-[22px] font-bold text-white mb-0.5">🌾 শস্য তথ্যভাণ্ডার</h1>
            <p className="text-[11px] text-white/60">AI-চালিত বাংলাদেশ ফসল ডাটাবেস — {bn(CROP_CATEGORIES.length)} ক্যাটেগরি</p>
          </div>
          {activeCat && (
            <div className="text-4xl opacity-80">{activeCat.icon}</div>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 pb-24">
        {/* Category Navigation Pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4">
          {CROP_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                setActiveCategory(cat.value);
                setExpandedCrop(null);
                setSearch("");
                setSeasonFilter("সব");
              }}
              className={`whitespace-nowrap text-[11px] font-bold px-3.5 py-2 rounded-full border-2 transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                activeCategory === cat.value
                  ? "bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-green-300 hover:text-green-600"
              }`}
            >
              <span className="text-sm">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ফসলের নাম বা এলাকা দিয়ে খুঁজুন..."
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-green-300"
              }`}
            >
              {s === "সব" ? "📊" : s === "রবি" ? "❄️" : "🌧️"} {s}
            </button>
          ))}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
            {bn(filtered.length)} টি ফসল পাওয়া গেছে
          </div>
          <div className="flex items-center gap-2">
            {aiCrops.length > 0 && (
              <div className="text-[9px] text-green-500 font-medium flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                AI তথ্য
              </div>
            )}
            {isHardcodedView && (
              <div className="text-[9px] text-amber-500 font-medium flex items-center gap-1">
                📚 স্থানীয় তথ্য
              </div>
            )}
            {loading && activeCategory === "Grains" && aiCrops.length === 0 && (
              <div className="text-[9px] text-green-500 font-medium flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                AI লোড হচ্ছে...
              </div>
            )}
          </div>
        </div>

        {/* Error state with retry */}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5 text-center">
            <div className="text-3xl mb-2">⚠️</div>
            <div className="text-sm text-red-700 dark:text-red-400 mb-3">{error}</div>
            <button
              onClick={() => {
                fetchedRef.current[activeCategory] = false;
                setCategoryCache((prev) => {
                  const next = { ...prev };
                  delete next[activeCategory];
                  return next;
                });
                fetchCrops(activeCategory);
              }}
              className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-full px-5 py-2 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              আবার চেষ্টা করুন
            </button>
          </div>
        )}

        {/* Loading skeleton (non-Grains or Grains with no fallback) */}
        {loading && !isHardcodedView && <SkeletonCards />}

        {/* Hardcoded crops shown even while Grains AI loads */}
        {loading && isHardcodedView && (
          <div className="space-y-2.5">
            {(filtered as HardcodedCrop[]).map((crop, i) => (
              <HardcodedCropCard
                key={`hc-${i}`}
                crop={crop}
                isExpanded={expandedCrop === crop.name}
                onToggle={() =>
                  setExpandedCrop(expandedCrop === crop.name ? null : crop.name)
                }
              />
            ))}
          </div>
        )}

        {/* Crop cards (not loading, or Grains with fallback already shown) */}
        {!loading && (
          <div className="space-y-2.5">
            {filtered.map((crop, i) => {
              if (isHardcodedView) {
                const hc = crop as HardcodedCrop;
                return (
                  <HardcodedCropCard
                    key={`hc-${i}`}
                    crop={hc}
                    isExpanded={expandedCrop === hc.name}
                    onToggle={() =>
                      setExpandedCrop(expandedCrop === hc.name ? null : hc.name)
                    }
                  />
                );
              }
              const ai = crop as AICrop;
              const cropKey = ai.id || `ai-${i}`;
              return (
                <CropCard
                  key={cropKey}
                  crop={ai}
                  isExpanded={expandedCrop === (ai.id || ai.name)}
                  onToggle={() =>
                    setExpandedCrop(
                      expandedCrop === (ai.id || ai.name) ? null : (ai.id || ai.name)
                    )
                  }
                  isAiData={true}
                />
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🌾</div>
            <div className="text-sm text-gray-400 dark:text-gray-500 mb-2">
              কোনো ফসল পাওয়া যায়নি
            </div>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs font-bold text-green-600 hover:text-green-700 cursor-pointer"
              >
                সার্চ মুছুন
              </button>
            )}
          </div>
        )}

        {/* Loading indicator for Grains when AI is loading in background */}
        {activeCategory === "Grains" && loading && (
          <div className="mt-4 text-center">
            <div className="text-[10px] text-green-500 font-medium flex items-center justify-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              AI থেকে আরও তথ্য লোড হচ্ছে...
            </div>
          </div>
        )}

        {/* Category stats footer */}
        {!loading && filtered.length > 0 && (
          <div className="mt-6 text-center">
            <div className="text-[10px] text-gray-400 dark:text-gray-500">
              {activeCat?.icon} {activeCat?.name} — বাংলাদেশ ফসল তথ্যভাণ্ডার
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
