"use client";

/**
 * weather-intelligence.tsx — Krishi Weather Intelligence (KWI) main experience.
 *
 * A self-contained tabbed dashboard embedded at /weather-intelligence:
 *   [ ওভারভিউ | আবহাওয়া | ঝুঁকি | ক্যালেন্ডার ]
 *
 * Bangla first: every label defaults to Bangla via KrishiAI's LanguageContext.
 * Zero new npm dependencies — data layer is in hooks/use-kwi.ts, charts are
 * inline SVG, UI primitives are local or already shipped with KrishiAI.
 */

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useKwiIntelligence, useActiveCrop } from "@/hooks/use-kwi";
import { KwiOverview } from "@/components/kwi/overview";
import type { KwiTab } from "@/components/kwi/overview";
import { WeatherDetails } from "@/components/kwi/weather-details";
import { RiskDashboardView } from "@/components/kwi/risk-dashboard";
import { CropCalendarView } from "@/components/kwi/crop-calendar";
import { getCropConfig, getAllCropConfigs } from "@/lib/kwi/engines/crop-configs";
import { getScoreLabel, toBnDigits } from "@/lib/kwi/formatters";
import { ScoreGauge } from "@/components/kwi/score-gauge";
import { KwiLiveStatus } from "@/components/kwi/live-status";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard, Cloud, ShieldAlert, CalendarDays,
  MapPin, RefreshCw, AlertTriangle, Sprout,
} from "lucide-react";

// ── Tab metadata (Bangla first) ──────────────────────────────────────────────
const TABS: { id: KwiTab; icon: typeof Cloud; bn: string; en: string }[] = [
  { id: "overview", icon: LayoutDashboard, bn: "ওভারভিউ", en: "Overview" },
  { id: "weather", icon: Cloud, bn: "আবহাওয়া", en: "Weather" },
  { id: "risks", icon: ShieldAlert, bn: "ঝুঁকি", en: "Risks" },
  { id: "calendar", icon: CalendarDays, bn: "ক্যালেন্ডার", en: "Calendar" },
];

export function WeatherIntelligence() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<KwiTab>("overview");
  const intel = useKwiIntelligence();
  const { cropId, sowingDate, setCropId, setSowingDate } = useActiveCrop();

  const {
    weather, isLoading, error, refetch,
    risks, recommendations, calendar, disease, farmSummary, crop,
  } = intel;

  const alertCount = risks?.alerts.length ?? 0;
  const urgentCount = recommendations.filter(r => r.priority === "urgent").length;
  const allCrops = getAllCropConfigs();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-5 sm:px-6">
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
              {lang === "bn" ? "আবহাওয়া বুদ্ধিমত্তা" : "Weather Intelligence"}
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {weather
                ? `${weather.location.name}${weather.location.district ? `, ${weather.location.district}` : ""}`
                : lang === "bn" ? "লোকেশন লোড হচ্ছে…" : "Loading location…"}
            </p>
            <KwiLiveStatus className="mt-1" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {farmSummary && (
              <div className="flex items-center gap-2 rounded-full border bg-card px-2.5 py-1">
                <ScoreGauge score={farmSummary.weatherIntelligenceScore} size={30} strokeWidth={4} />
                <div className="leading-tight hidden sm:block">
                  <div className="text-xs font-bold tabular-nums">
                    {lang === "bn" ? toBnDigits(farmSummary.weatherIntelligenceScore) : farmSummary.weatherIntelligenceScore}
                    <span className="text-muted-foreground font-normal">{lang === "bn" ? "/১০০" : "/100"}</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    {getScoreLabel(farmSummary.weatherIntelligenceScore, lang)}
                  </div>
                </div>
              </div>
            )}
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={refetch} aria-label={lang === "bn" ? "রিফ্রেশ" : "Refresh"}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* ── Crop & sowing selector ──────────────────────────── */}
        <div className="rounded-xl border bg-card p-3 mb-4 space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Sprout className="h-3.5 w-3.5 text-primary" />
              {lang === "bn" ? "ফসল:" : "Crop:"}
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {allCrops.map(cfg => (
                <button
                  key={cfg.id}
                  onClick={() => setCropId(cfg.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1",
                    cropId === cfg.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted",
                  )}
                  aria-pressed={cropId === cfg.id}
                >
                  <span>{cfg.icon}</span>
                  {lang === "bn" ? cfg.nameBn : cfg.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="kwi-sowing">
              {lang === "bn" ? "বপনের তারিখ:" : "Sowing date:"}
            </label>
            <input
              id="kwi-sowing"
              type="date"
              value={sowingDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={e => e.target.value && setSowingDate(e.target.value)}
              className="rounded-md border bg-background px-2 py-1 text-xs"
            />
            <span className="text-[10px] text-muted-foreground">
              {lang === "bn"
                ? "ক্যালেন্ডার ও পর্যায় গণনার জন্য ব্যবহৃত হয়"
                : "Used for stage & calendar calculations"}
            </span>
          </div>
        </div>

        {/* ── Alert / urgent badges ───────────────────────────── */}
        {(alertCount > 0 || urgentCount > 0) && (
          <div className="flex gap-2 mb-4">
            {alertCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {lang === "bn" ? `${toBnDigits(alertCount)} টি সতর্কতা` : `${alertCount} alerts`}
              </Badge>
            )}
            {urgentCount > 0 && (
              <Badge className="bg-orange-500 hover:bg-orange-500 gap-1">
                <AlertTriangle className="h-3 w-3" />
                {lang === "bn" ? `${toBnDigits(urgentCount)} টি অতি জরুরি` : `${urgentCount} urgent`}
              </Badge>
            )}
          </div>
        )}

        {/* ── Tabs nav ────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-1.5 mb-4" role="tablist" aria-label={lang === "bn" ? "KWI সেকশন" : "KWI sections"}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-col sm:flex-row items-center justify-center gap-1 rounded-lg border py-2 text-[11px] sm:text-xs font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                <tab.icon className="h-4 w-4" />
                {lang === "bn" ? tab.bn : tab.en}
                {tab.id === "risks" && alertCount > 0 && (
                  <span
                    className={cn(
                      "min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center",
                      active ? "bg-primary-foreground text-primary" : "bg-destructive text-destructive-foreground",
                    )}
                  >
                    {lang === "bn" ? toBnDigits(alertCount) : alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Content ─────────────────────────────────────────── */}
        {isLoading && !weather ? (
          <LoadingState lang={lang} />
        ) : error && !weather ? (
          <ErrorState lang={lang} onRetry={refetch} />
        ) : weather ? (
          <>
            {activeTab === "overview" && (
              <KwiOverview
                summary={farmSummary}
                recommendations={recommendations}
                calendar={calendar}
                lang={lang}
                weather={weather}
                cropName={lang === "bn" ? crop.config.nameBn : crop.config.name}
                onNavigate={setActiveTab}
              />
            )}
            {activeTab === "weather" && <WeatherDetails weather={weather} lang={lang} />}
            {activeTab === "risks" && risks && (
              <RiskDashboardView risks={risks} disease={disease} lang={lang} />
            )}
            {activeTab === "calendar" && (
              <CropCalendarView calendar={calendar} weather={weather} lang={lang} crop={crop} />
            )}
          </>
        ) : null}

        {/* ── Footer note ─────────────────────────────────────── */}
        <p className="text-[10px] text-muted-foreground text-center mt-6">
          {lang === "bn"
            ? "ডেটা সোর্স: Open-Meteo · ইঞ্জিন: KWI (১৪ ঝুঁকি বিভাগ, ৬ রোগ মডেল) · স্বয়ংক্রিয় রিফ্রেশ ১৫ মিনিট"
            : "Data: Open-Meteo · Engine: KWI (14 risk categories, 6 disease models) · Auto-refresh 15 min"}
        </p>
      </div>
    </div>
  );
}

// ── Loading state ────────────────────────────────────────────────────────────
function LoadingState({ lang }: { lang: "en" | "bn" }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-xl" />
      <p className="text-xs text-muted-foreground text-center animate-pulse">
        {lang === "bn" ? "Open-Meteo থেকে আবহাওয়া ও ইঞ্জিন ডেটা লোড হচ্ছে…" : "Loading weather + engine data from Open-Meteo…"}
      </p>
    </div>
  );
}

// ── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ lang, onRetry }: { lang: "en" | "bn"; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <p className="text-sm text-muted-foreground max-w-xs">
        {lang === "bn"
          ? "আবহাওয়া ডেটা আনতে ব্যর্থ। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।"
          : "Failed to fetch weather data. Check your connection and try again."}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {lang === "bn" ? "আবার চেষ্টা করুন" : "Retry"}
      </Button>
    </div>
  );
}

// re-export crop config helper for potential external use
export { getCropConfig };
