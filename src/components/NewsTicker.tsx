/**
 * NewsTicker — Horizontal scrolling agriculture news with datetime
 * Fetches from /api/news and displays headlines in a smooth infinite scroll.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface NewsItem {
  title: string;
  source?: string;
  date?: string;
}

export default function NewsTicker() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      if (!res.ok) return;
      const data = await res.json();

      // Extract headlines from any available tab
      const headlines: NewsItem[] = [];
      const sources = ["headlines", "bulletin", "english", "gov", "intl"];
      for (const src of sources) {
        const items = data?.[src] || [];
        if (Array.isArray(items)) {
          for (const item of items.slice(0, 5)) {
            if (item?.title) {
              headlines.push({
                title: item.title,
                source: item.source || src,
                date: item.date || item.pubDate || item.publishedAt,
              });
            }
          }
        }
      }
      if (headlines.length > 0) setNews(headlines);
    } catch {
      // silently fail
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 30 * 60 * 1000); // refresh every 30 min
    return () => clearInterval(interval);
  }, [fetchNews]);

  // Don't render anything until we have news or have tried loading
  if (!loaded || news.length === 0) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("bn-BD", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // Duplicate items for seamless loop
  const displayItems = [...news, ...news];

  return (
    <div className="w-full bg-gradient-to-r from-[#0b6623] to-[#1b8a3e] overflow-hidden relative">
      {/* Label */}
      <div className="absolute left-0 top-0 bottom-0 z-10 bg-[#0b6623] px-3 flex items-center gap-1.5 border-r border-white/20">
        <span className="text-[11px]">📰</span>
        <span className="text-[10px] font-bold text-white whitespace-nowrap">
          সর্বশেষ
        </span>
      </div>

      {/* Scrolling container */}
      <div className="pl-[72px] overflow-hidden">
        <div
          ref={scrollRef}
          className="flex items-center py-2 animate-ticker-scroll whitespace-nowrap"
        >
          {displayItems.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 mx-4">
              {item.date && (
                <span className="text-[9px] text-white/50 font-medium">
                  {formatDate(item.date)}
                </span>
              )}
              <span className="text-[11px] text-white/90 font-medium">
                {item.title}
              </span>
              {item.source && (
                <span className="text-[8px] bg-white/15 text-white/70 px-1.5 py-0.5 rounded-full">
                  {item.source}
                </span>
              )}
              <span className="text-white/30 mx-1">•</span>
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker-scroll {
          animation: ticker-scroll ${Math.max(30, news.length * 8)}s linear infinite;
        }
        .animate-ticker-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}