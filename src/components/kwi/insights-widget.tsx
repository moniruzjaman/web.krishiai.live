"use client";

/**
 * insights-widget.tsx — "Weather Intelligence — Key Insights" widget for the
 * KrishiAI home page.
 *
 * Pulls the most decision-relevant KWI signals and surfaces them inline:
 * - Weather Intelligence Score (gauge + label)
 * - Active risk alerts (top 2)
 * - Top priorities / recommendations (top 2)
 * - One-line Bangla-first weather summary
 * - Today's top field task
 *
 * Links to /weather-intelligence for the full experience.
 * Bangla first: defaults to Bangla through the shared LanguageContext.
 */

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useKwiIntelligence } from "@/hooks/use-kwi";
import { getScoreLabel, toBnDigits } from "@/lib/kwi/formatters";
import { ScoreGauge } from "@/components/kwi/score-gauge";
import { KwiLiveStatus } from "@/components/kwi/live-status";
import { cn } from "@/lib/utils";

import { AlertTriangle, ChevronRight, CloudSun, Zap, Clock, Sparkles } from "lucide-react";

export default function KwiInsightsWidget() {
  const { lang } = useLanguage();
  const { farmSummary, recommendations, isLoading, weather } = useKwiIntelligence();
  const bn = (v: string | number) => (lang === "bn" ? toBnDigits(v) : String(v));

  const topPriorities = (farmSummary?.topPriorities ?? recommendations)
    .slice(0, 2);
  const alerts = (farmSummary?.alerts ?? []).slice(0, 2);
  const topTask = farmSummary?.todayTasks?.[0];
  const score = farmSummary?.weatherIntelligenceScore ?? null;

  return (
    <div className="rounded-[14px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden card-shadow">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5 bg-gradient-to-r from-[#1b4332]/95 to-[#2d6a4f]/90">
        <Sparkles className="h-4 w-4 text-green-300 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-white leading-tight">
            {lang === "bn" ? "আবহাওয়া বুদ্ধিমত্তা — মূল অন্তর্দৃষ্টি" : "Weather Intelligence — Key Insights"}
          </div>
          <div className="text-[10px] text-white/60">
            {lang === "bn"
              ? "১৪ ঝুঁকি বিভাগ · রোগ পূর্বাভাস · AI সুপারিশ"
              : "14 risk categories · disease forecast · AI recommendations"}
          </div>
          <KwiLiveStatus dark datetimeOnly className="mt-0.5" />
        </div>
        {score !== null && (
          <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2 py-1 shrink-0">
            <ScoreGauge score={score} size={26} strokeWidth={4} />
            <div className="leading-none pr-0.5">
              <span className="text-white text-sm font-bold tabular-nums">{bn(score)}</span>
              <span className="text-white/50 text-[9px]">/{lang === "bn" ? "১০০" : "100"}</span>
              <div className="text-[8px] text-white/70">{getScoreLabel(score, lang)}</div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Loading state */}
        {isLoading && !weather && (
          <div className="space-y-2.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-10 rounded-lg bg-gray-100 dark:bg-gray-700/60 animate-pulse" />
            ))}
            <p className="text-[11px] text-gray-400 text-center">
              {lang === "bn" ? "KWI ইঞ্জিন চলছে…" : "Running KWI engines…"}
            </p>
          </div>
        )}

        {/* Alerts */}
        {!isLoading && alerts.length > 0 && (
          <div className={cn(
            "rounded-lg border p-2.5 space-y-1.5",
            alerts.some(a => a.level === "very_high" || a.level === "high")
              ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
              : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
          )}>
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className={cn(
                  "h-3.5 w-3.5 mt-0.5 shrink-0",
                  a.level === "very_high" || a.level === "high" ? "text-red-500" : "text-amber-500",
                )} />
                <p className="text-[12px] leading-snug text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">{lang === "bn" ? a.titleBn : a.title}:</span>{" "}
                  {lang === "bn" ? a.messageBn : a.message}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Priorities */}
        {!isLoading && topPriorities.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-500" />
              {lang === "bn" ? "আজকের অগ্রাধিকার" : "Today's Priorities"}
            </div>
            {topPriorities.map(rec => (
              <div key={rec.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/40">
                <span className={cn(
                  "w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-white text-[10px] font-bold mt-0.5",
                  rec.priority === "urgent" ? "bg-red-500" : "bg-orange-500",
                )}>
                  {rec.priority === "urgent" ? "!" : "↑"}
                </span>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                    {lang === "bn" ? rec.titleBn : rec.title}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">
                    {lang === "bn" ? rec.reasonBn : rec.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Top field task */}
        {!isLoading && !topPriorities.length && topTask && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/40">
            <Clock className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-gray-900 dark:text-gray-100">
                {lang === "bn" ? topTask.nameBn : topTask.name}
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                {lang === "bn" ? topTask.descriptionBn : topTask.description}
              </div>
            </div>
          </div>
        )}

        {/* Favorable state */}
        {!isLoading && score !== null && alerts.length === 0 && topPriorities.length === 0 && !topTask && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <CloudSun className="h-4 w-4 text-green-600 shrink-0" />
            <p className="text-[12px] text-green-700 dark:text-green-300">
              {lang === "bn"
                ? "পরিস্থিতি অনুকূল — কোনো জরুরি ব্যবস্থা প্রয়োজন নেই।"
                : "Conditions are favorable — no urgent actions needed."}
            </p>
          </div>
        )}

        {/* CTA */}
        <Link
          href="/weather-intelligence"
          className="flex items-center justify-center gap-1 rounded-full bg-[#1b8a3e] hover:bg-[#177235] text-white text-[12px] font-bold py-2.5 transition-colors no-underline"
        >
          {lang === "bn" ? "সম্পূর্ণ আবহাওয়া বুদ্ধিমত্তা দেখুন" : "View Full Weather Intelligence"}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
