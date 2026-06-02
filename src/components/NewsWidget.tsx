/**
 * NewsWidget.tsx — Enhanced News Widget for KrishiAI
 *
 * Key improvements over original:
 * - Tab renamed: "🏛️ সরকারি সংস্থা" → "🌱 কৃষি সংবাদ" (more honest — source is Google News)
 * - New tab: "📰 ইংরেজি সংবাদ" for English agri news from Google News
 * - Source badges with colored styling
 * - Relative time display
 * - Hover effects with left border accent
 * - Better empty state handling
 * - Footer freshness indicators
 */

"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  color: string;
  icon?: string;
}

interface DailyBulletin {
  title: string;
  body: string;
  warning?: string;
  todos?: string[];
  season: string;
  dateStr: string;
}

interface NewsResponse {
  ok: boolean;
  date: string;
  season: string;
  bulletin: DailyBulletin | null;
  headlines: NewsItem[];
  englishHeadlines: NewsItem[];
  sources: {
    headlines: "google-news-rss" | "fallback";
    bulletin: "ai-generated" | "unavailable";
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const bn = (n: number | string) =>
  String(Math.round(Number(n))).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

const timeAgo = (d: string): string => {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (isNaN(mins) || mins < 0) return "আজ";
  if (mins < 60) return `${bn(mins)} মি আগে`;
  if (mins < 1440) return `${bn(Math.floor(mins / 60))} ঘণ্টা আগে`;
  return `${bn(Math.floor(mins / 1440))} দিন আগে`;
};

const formatBnDate = (d: string): string => {
  try {
    return new Date(d).toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

// ── Cache helpers ────────────────────────────────────────────────────────────
const CACHE_KEY_PREFIX = "krishi_news_";

function todayKey() {
  return CACHE_KEY_PREFIX + new Date().toISOString().slice(0, 10);
}

function getCached(): NewsResponse | null {
  try {
    if (typeof window === "undefined") return null;
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(CACHE_KEY_PREFIX) && k !== todayKey())
        localStorage.removeItem(k);
    }
    const raw = localStorage.getItem(todayKey());
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCache(data: NewsResponse) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(todayKey(), JSON.stringify(data));
  } catch {
    /* storage full */
  }
}

// ── Component ────────────────────────────────────────────────────────────────
type TabType = "bulletin" | "headlines" | "english";

function useNewsData() {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNews = async (forceRefresh = false) => {
    // Check cache first (only on client), unless force refresh
    if (!forceRefresh) {
      const cached = getCached();
      if (cached) {
        setData(cached);
        setLoading(false);
        setLastUpdated(new Date());
        return;
      }
    }

    setLoading(true);
    try {
      const url = forceRefresh ? "/api/news?refresh=1" : "/api/news";
      const r = await fetch(url);
      const d: NewsResponse | null = r.ok ? await r.json() : null;
      if (d?.ok) {
        setCache(d);
        setData(d);
        setLastUpdated(new Date());
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    let active = true;

    async function loadInitial() {
      const cached = getCached();
      if (cached && active) {
        setData(cached);
        setLoading(false);
        setLastUpdated(new Date());
        return;
      }

      setLoading(true);
      try {
        const r = await fetch("/api/news");
        const d: NewsResponse | null = r.ok ? await r.json() : null;
        if (active && d?.ok) {
          setCache(d);
          setData(d);
          setLastUpdated(new Date());
        }
      } catch {
        // ignore
      }
      if (active) setLoading(false);
    }

    loadInitial();

    // Auto-refresh every 30 minutes while the page is open
    const interval = setInterval(() => refresh(), 30 * 60 * 1000);

    // Also refresh when the tab/window regains focus (user returns to page)
    const onFocus = () => {
      const cached = getCached();
      if (!cached) refresh();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return { data, loading, lastUpdated, refresh: () => fetchNews(true) };
}

export default function NewsWidget() {
  const { data, loading, lastUpdated, refresh } = useNewsData();
  const [tab, setTab] = useState<TabType>("bulletin");

  const getShownItems = (): NewsItem[] => {
    if (tab === "headlines") return data?.headlines ?? [];
    if (tab === "english") return data?.englishHeadlines ?? [];
    return [];
  };

  const shown = getShownItems();

  return (
    <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden card-shadow">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50/80">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse-dot flex-shrink-0" />
        <span className="text-[13px] font-bold text-gray-900">কৃষি তথ্য</span>
        {data?.season && (
          <Badge
            variant="secondary"
            className="ml-auto text-[10px] bg-green-100 text-green-800 border-0 px-2 py-0.5 font-bold"
          >
            {data.season}
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabType)}
        className="w-full"
      >
        <TabsList className="w-full h-auto p-0 bg-transparent border-b border-gray-200 rounded-none">
          <TabsTrigger
            value="bulletin"
            className="flex-1 py-2.5 px-2 text-xs font-semibold text-gray-500 data-[state=active]:text-green-700 data-[state=active]:bg-green-50 data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none border-b-2 border-transparent transition-all"
          >
            📋 দৈনিক বুলেটিন
          </TabsTrigger>
          <TabsTrigger
            value="headlines"
            className="flex-1 py-2.5 px-2 text-xs font-semibold text-gray-500 data-[state=active]:text-green-700 data-[state=active]:bg-green-50 data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none border-b-2 border-transparent transition-all"
          >
            🌱 কৃষি সংবাদ
          </TabsTrigger>
          <TabsTrigger
            value="english"
            className="flex-1 py-2.5 px-2 text-xs font-semibold text-gray-500 data-[state=active]:text-green-700 data-[state=active]:bg-green-50 data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none border-b-2 border-transparent transition-all"
          >
            📰 ইংরেজি সংবাদ
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      {loading ? (
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="inline-block animate-spin-slow">⏳</span>
            আজকের কৃষি তথ্য লোড হচ্ছে…
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : tab === "bulletin" ? (
        /* ── BULLETIN TAB ──────────────────────────────────────────── */
        data?.bulletin ? (
          <div className="p-4 animate-slide-in">
            {/* Date badge */}
            <div className="text-[11px] text-gray-400 mb-2">
              📅{" "}
              {data.bulletin.dateStr ||
                new Date().toLocaleDateString("bn-BD", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
            </div>

            {/* Title */}
            <div className="text-[15px] font-extrabold text-gray-900 leading-relaxed mb-3">
              {data.bulletin.title}
            </div>

            {/* Body */}
            <div className="text-[13px] text-gray-700 leading-loose mb-3">
              {data.bulletin.body}
            </div>

            {/* Warning */}
            {data.bulletin.warning && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-3 flex gap-2">
                <span className="flex-shrink-0">⚠️</span>
                <span className="text-[12px] text-orange-700 leading-relaxed">
                  {data.bulletin.warning}
                </span>
              </div>
            )}

            {/* To-dos */}
            {data.bulletin.todos && data.bulletin.todos.length > 0 && (
              <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                <div className="text-[11px] font-bold text-green-800 mb-2">
                  ✅ আজকের করণীয়
                </div>
                {data.bulletin.todos.map((t, i) => (
                  <div
                    key={i}
                    className="flex gap-2 items-start text-[12px] text-green-800 mb-1.5"
                  >
                    <span
                      className="w-[18px] h-[18px] bg-green-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ marginTop: "2px" }}
                    >
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{t}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Source badge */}
            <div className="mt-3 flex justify-between items-center text-[10px] text-gray-400">
              <span>🤖 AI · কৃষি তথ্যভিত্তিক</span>
              <Badge
                variant="secondary"
                className={`text-[10px] border-0 px-2 py-0.5 font-bold ${
                  data.sources?.bulletin === "ai-generated"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {data.sources?.bulletin === "ai-generated"
                  ? "AI তৈরি"
                  : "ক্যালেন্ডার"}
              </Badge>
            </div>
          </div>
        ) : (
          /* Bulletin fallback */
          <div className="p-4">
            <div className="text-[13px] font-bold text-green-800 mb-2">
              🌱 {data?.season || "চলতি মৌসুম"}
            </div>
            <div className="text-[12px] text-gray-700 leading-loose">
              আজকের AI বুলেটিন তৈরি হচ্ছে। কৃষি সংবাদ ট্যাবে সর্বশেষ কৃষি
              সংবাদ দেখুন।
            </div>
          </div>
        )
      ) : /* ── HEADLINES / ENGLISH TABS ────────────────────────────────── */
      shown.length === 0 ? (
        <div className="p-5 text-center text-sm text-gray-400">
          কোনো সংবাদ পাওয়া যায়নি
        </div>
      ) : (
        <ScrollArea className="max-h-[400px] custom-scrollbar">
          <div className="divide-y divide-gray-100">
            {shown.map((it, i) => (
              <a
                key={i}
                href={it.link}
                target="_blank"
                rel="noopener noreferrer"
                className="news-item-hover block px-4 py-3 no-underline"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  {/* Source badge */}
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      color: it.color,
                      backgroundColor: it.color + "15",
                      border: `1px solid ${it.color}30`,
                    }}
                  >
                    {it.icon} {it.source}
                  </span>
                  {/* Time info */}
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className="text-[10px] text-green-600 font-semibold whitespace-nowrap">
                      {timeAgo(it.pubDate)}
                    </span>
                    <span className="text-[9px] text-gray-400 whitespace-nowrap">
                      {formatBnDate(it.pubDate)}
                    </span>
                  </div>
                </div>
                {/* Title */}
                <div className="flex items-start gap-1.5">
                  <span className="text-[12.5px] text-gray-900 leading-relaxed font-medium flex-1">
                    {it.title}
                  </span>
                  <ExternalLink className="w-3 h-3 text-gray-300 flex-shrink-0 mt-1" />
                </div>
              </a>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Footer: source freshness + refresh */}
      {!loading && data && (
        <div className="px-4 py-2 border-t border-gray-100 flex gap-3 text-[10px] text-gray-400 flex-wrap items-center">
          <span className="flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                data.sources.headlines === "google-news-rss"
                  ? "bg-green-500"
                  : "bg-yellow-500"
              }`}
            />
            {data.sources.headlines === "google-news-rss" ? "Google News RSS" : "মৌসুমি তথ্য"}
          </span>
          {lastUpdated && (
            <span>
              আপডেট: {lastUpdated.toLocaleTimeString("bn-BD")}
            </span>
          )}
          <span className="ml-auto flex items-center gap-2">
            <span>প্রতিদিন স্বয়ংক্রিয়</span>
            <button
              onClick={(e) => { e.preventDefault(); refresh(); }}
              className="text-green-600 hover:text-green-700 font-bold cursor-pointer bg-transparent border-none p-0"
              title="এখনই রিফ্রেশ করুন"
            >
              🔄
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
