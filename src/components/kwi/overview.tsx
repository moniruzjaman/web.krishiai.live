"use client";

import type { ReactNode } from "react";

/**
 * overview.tsx — KWI Overview dashboard (adapted from KWI HomeDashboard).
 *
 * Changes vs original KWI version:
 * - Language comes from KrishiAI's LanguageContext (Bangla first).
 * - Section navigation is delegated to the parent via onNavigate()
 *   instead of the KWI zustand store.
 * - All numerals render as Bangla digits when lang === "bn".
 * - shadcn Progress/Separator replaced by dependency-free KProgress/KSeparator.
 */

import { useMemo } from "react";
import type { FarmSummary, Recommendation, CropCalendarEntry, WeatherData } from "@/lib/kwi/types";
import { cn } from "@/lib/utils";
import {
  getScoreLabel,
  getRiskColor,
  getPriorityColor,
  formatTemperature,
  formatPercent,
  getWeatherIcon,
  toBnDigits,
} from "@/lib/kwi/formatters";
import { KProgress, KSeparator } from "@/components/kwi/ui-bits";
import { ScoreGauge } from "@/components/kwi/score-gauge";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Activity, AlertTriangle, CheckCircle2, Clock, ChevronRight,
  Droplets, Leaf, Shield, Sprout, TrendingUp, Wind,
  Zap, ThumbsUp, Target, Cloud,
} from "lucide-react";

export type KwiTab = "overview" | "weather" | "risks" | "calendar";

interface Props {
  summary: FarmSummary | null;
  recommendations: Recommendation[];
  calendar: CropCalendarEntry[];
  lang: "en" | "bn";
  weather: WeatherData | null;
  cropName: string;
  onNavigate: (tab: KwiTab) => void;
}

export function KwiOverview({ summary, recommendations, calendar, lang, weather, cropName, onNavigate }: Props) {
  const urgentRecs = recommendations.filter(r => r.priority === "urgent" || r.priority === "high");
  const otherRecs = recommendations.filter(r => r.priority !== "urgent" && r.priority !== "high");
  const bn = (v: string | number) => (lang === "bn" ? toBnDigits(v) : String(v));

  const weatherSummaryText = useMemo(() => {
    if (!summary) return "";
    return lang === "bn" ? summary.weatherSummaryBn : summary.weatherSummary;
  }, [summary, lang]);

  return (
    <div className="space-y-5">
      {/* Alert Banner */}
      {summary?.alerts && summary.alerts.length > 0 && (
        <AlertBanner alerts={summary.alerts} lang={lang} />
      )}

      {/* Score Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ScoreCard
          title={lang === "bn" ? "আবহাওয়া স্কোর" : "Weather Score"}
          score={summary?.weatherIntelligenceScore ?? 0}
          icon={<Cloud className="h-5 w-5 text-primary" />}
          description={summary ? getScoreLabel(summary.weatherIntelligenceScore, lang) : ""}
          lang={lang}
        />
        <ScoreCard
          title={lang === "bn" ? "খামারের স্বাস্থ্য" : "Farm Health"}
          score={summary?.farmHealthScore ?? 0}
          icon={<Leaf className="h-5 w-5 text-emerald-500" />}
          description={cropName}
          lang={lang}
        />
        <StatCard
          title={lang === "bn" ? "সক্রিয় সতর্কতা" : "Active Alerts"}
          value={bn(summary?.alerts.length ?? 0)}
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
          subtitle={urgentRecs.length > 0 ? `${bn(urgentRecs.length)} ${lang === "bn" ? "জরুরি" : "urgent"}` : lang === "bn" ? "কোনো সতর্কতা নেই" : "No alerts"}
          color="text-amber-600"
        />
        <StatCard
          title={lang === "bn" ? "শীর্ষ অগ্রাধিকার" : "Top Priorities"}
          value={bn(urgentRecs.length)}
          icon={<Target className="h-5 w-5 text-primary" />}
          subtitle={recommendations.length > 0 ? `${bn(recommendations.length)} ${lang === "bn" ? "মোট সুপারিশ" : "total"}` : lang === "bn" ? "কোনো অগ্রাধিকার নেই" : "No priorities"}
          color="text-primary"
        />
      </div>

      {/* Weather summary strip */}
      {weatherSummaryText && (
        <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground leading-relaxed">
          {weatherSummaryText}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Urgent Priorities */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                {lang === "bn" ? "শীর্ষ অগ্রাধিকার" : "Top Priorities"}
              </CardTitle>
              {recommendations.length > 3 && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => onNavigate("risks")}>
                  {lang === "bn" ? "সব দেখুন" : "View all"} <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {urgentRecs.length === 0 && otherRecs.length === 0 ? (
              <EmptyState
                message={lang === "bn" ? "কোনো সক্রিয় অগ্রাধিকার নেই — পরিস্থিতি অনুকূল!" : "No active priorities — conditions are favorable!"}
                icon={<CheckCircle2 className="h-8 w-8 text-emerald-500" />}
              />
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-3">
                  {urgentRecs.map(rec => (
                    <RecommendationCard key={rec.id} rec={rec} lang={lang} />
                  ))}
                  {otherRecs.slice(0, 3).map(rec => (
                    <RecommendationCard key={rec.id} rec={rec} lang={lang} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Weather Quick Look */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              {lang === "bn" ? "দ্রুত আবহাওয়া" : "Weather Quick Look"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WeatherQuickLook weather={weather} lang={lang} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Risks */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-orange-500" />
                {lang === "bn" ? "আসন্ন ঝুঁকি" : "Upcoming Risks"}
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => onNavigate("risks")}>
                {lang === "bn" ? "সব দেখুন" : "View all"} <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {summary?.upcomingRisks && summary.upcomingRisks.length > 0 ? (
              <div className="space-y-2.5">
                {summary.upcomingRisks.map((risk) => (
                  <div key={risk.category} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                    <div className={cn("w-2 h-2 rounded-full shrink-0", risk.level === "high" || risk.level === "very_high" ? "bg-red-500" : risk.level === "moderate" ? "bg-amber-500" : "bg-emerald-500")} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{categoryBn(risk.category, lang)}</div>
                      <div className="text-xs text-muted-foreground truncate">{lang === "bn" ? risk.explanationBn : risk.explanation}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn("text-sm font-bold", getRiskColor(risk.level))}>{bn(risk.score)}</div>
                      <div className="text-[10px] text-muted-foreground">{riskLevelBn(risk.level, lang)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                message={lang === "bn" ? "কোনো আসন্ন ঝুঁকি নেই" : "No upcoming risks detected"}
                icon={<Shield className="h-8 w-8 text-emerald-500" />}
              />
            )}
          </CardContent>
        </Card>

        {/* Today's Tasks from Calendar */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                {lang === "bn" ? "আজকের কাজ" : "Today's Tasks"}
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => onNavigate("calendar")}>
                {lang === "bn" ? "সব দেখুন" : "View all"} <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {calendar.length > 0 && calendar[0].tasks.length > 0 ? (
              <div className="space-y-2.5">
                {calendar[0].tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                    <div className={cn("w-2 h-2 rounded-full shrink-0", task.priority === "critical" ? "bg-red-500" : task.priority === "high" ? "bg-amber-500" : "bg-emerald-500")} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{lang === "bn" ? task.nameBn : task.name}</div>
                      <div className="text-xs text-muted-foreground">{lang === "bn" ? task.descriptionBn : task.description}</div>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px]", getPriorityColor(task.priority))}>
                      {taskPriorityBn(task.priority, lang)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                message={lang === "bn" ? "আজকের জন্য কোনো কাজ নেই" : "No tasks scheduled for today"}
                icon={<CheckCircle2 className="h-8 w-8 text-emerald-500" />}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Shared bilingual helpers (also used by sibling views) ───────────────────
export function riskLevelBn(level: string, lang: "en" | "bn"): string {
  const map: Record<string, { en: string; bn: string }> = {
    low: { en: "Low", bn: "কম" },
    moderate: { en: "Moderate", bn: "মাঝারি" },
    high: { en: "High", bn: "উচ্চ" },
    very_high: { en: "Very High", bn: "অত্যন্ত উচ্চ" },
  };
  return map[level]?.[lang] ?? level;
}

export function categoryBn(cat: string, lang: "en" | "bn"): string {
  if (lang === "bn") {
    const map: Record<string, string> = {
      disease: "রোগ",
      spray_window: "স্প্রে সময়",
      irrigation: "সেচ",
      waterlogging: "জলাবদ্ধতা",
      flood: "বন্যা",
      heat_stress: "তাপ প্রাণী",
      cold_stress: "শীত প্রাণী",
      wind_damage: "বাতাসের ক্ষতি",
      harvest: "ফসল কাটা",
      lodging: "হেলে পড়া",
      pollination: "পরাগায়ন",
      seedling_stress: "চারা প্রাণী",
      nutrient_loss: "পুষ্টি ক্ষতি",
      field_accessibility: "মাঠে প্রবেশ",
    };
    return map[cat] ?? cat.replace(/_/g, " ");
  }
  return cat.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function taskPriorityBn(priority: string, lang: "en" | "bn"): string {
  if (lang !== "bn") return priority;
  const map: Record<string, string> = { critical: "অতি জরুরি", high: "জরুরি", medium: "মাঝারি", low: "কম" };
  return map[priority] ?? priority;
}

// ── Sub Components ───────────────────────────────────────────────────────────

function ScoreCard({ title, score, icon, description, lang }: { title: string; score: number; icon: ReactNode; description: string; lang: "en" | "bn" }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1">{icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold tabular-nums">{lang === "bn" ? toBnDigits(score) : score}</span>
              <span className="text-xs text-muted-foreground">{lang === "bn" ? "/১০০" : "/100"}</span>
            </div>
            {description && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{description}</p>}
          </div>
          <div className="w-14 h-14 shrink-0">
            <ScoreGauge score={score} size={56} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ title, value, icon, subtitle, color }: { title: string; value: string; icon: ReactNode; subtitle: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1">{icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <span className={cn("text-2xl font-bold", color)}>{value}</span>
            {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ rec, lang }: { rec: Recommendation; lang: "en" | "bn" }) {
  const bn = (v: string | number) => (lang === "bn" ? toBnDigits(v) : String(v));
  const priorityLabel = lang === "bn"
    ? ({ urgent: "অতি জরুরি", high: "জরুরি", medium: "মাঝারি", low: "কম" } as Record<string, string>)[rec.priority] ?? rec.priority
    : rec.priority;
  return (
    <div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold",
          rec.priority === "urgent" ? "bg-red-500" : rec.priority === "high" ? "bg-orange-500" : "bg-amber-500",
        )}>
          {rec.priority === "urgent" ? "!" : rec.priority === "high" ? "↑" : "→"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{lang === "bn" ? rec.titleBn : rec.title}</span>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getPriorityColor(rec.priority))}>
              {priorityLabel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {lang === "bn" ? rec.reasonBn : rec.reason}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              {bn(formatPercent(rec.confidence))}
            </span>
            {rec.expectedYieldImpact !== 0 && (
              <span className={cn("flex items-center gap-1", rec.expectedYieldImpact > 0 ? "text-emerald-600" : "text-red-600")}>
                <TrendingUp className="h-3 w-3" />
                {rec.expectedYieldImpact > 0 ? "+" : ""}{bn(rec.expectedYieldImpact)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertBanner({ alerts, lang }: { alerts: { title: string; titleBn: string; level: string; message: string; messageBn: string }[]; lang: "en" | "bn" }) {
  const isHigh = alerts.some(a => a.level === "very_high" || a.level === "high");
  return (
    <div className={cn(
      "rounded-xl p-3 border",
      isHigh ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
    )}>
      <div className="flex items-start gap-2">
        <AlertTriangle className={cn("h-4 w-4 mt-0.5 shrink-0", isHigh ? "text-red-500" : "text-amber-500")} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {lang === "bn" ? `${toBnDigits(alerts.length)} টি সক্রিয় সতর্কতা` : `${alerts.length} Active Alert${alerts.length > 1 ? "s" : ""}`}
          </p>
          <div className="mt-1 space-y-0.5">
            {alerts.slice(0, 3).map((a, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                {lang === "bn" ? a.titleBn : a.title}: {lang === "bn" ? a.messageBn : a.message}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeatherQuickLook({ weather, lang }: { weather: WeatherData | null; lang: "en" | "bn" }) {
  if (!weather) {
    return (
      <div className="space-y-3">
        <div className="h-10 w-32 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const c = weather.current;
  const today = weather.daily[0];
  const bn = (v: string | number) => (lang === "bn" ? toBnDigits(v) : String(v));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-3xl">{getWeatherIcon(c.weatherCode, c.isDay)}</span>
        <div>
          <span className="text-3xl font-bold tabular-nums">{formatTemperature(c.temperature, lang)}</span>
          <p className="text-xs text-muted-foreground">{lang === "bn" ? "অনুভূত" : "Feels"} {formatTemperature(c.feelsLike, lang)}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: <Droplets className="h-3.5 w-3.5 text-blue-500" />, label: lang === "bn" ? "আর্দ্রতা" : "Humidity", value: bn(formatPercent(c.humidity)) },
          { icon: <Wind className="h-3.5 w-3.5 text-slate-500" />, label: lang === "bn" ? "বাতাস" : "Wind", value: `${bn(Math.round(c.windSpeed))} ${lang === "bn" ? "কিমি/ঘ" : "km/h"}` },
          { icon: <Sprout className="h-3.5 w-3.5 text-orange-500" />, label: lang === "bn" ? "বৃষ্টি" : "Rain", value: today ? bn(formatPercent(today.precipitationProbabilityMax)) : "—" },
          { icon: <Zap className="h-3.5 w-3.5 text-yellow-500" />, label: lang === "bn" ? "ইউভি" : "UV", value: bn(c.uvIndex.toFixed(1)) },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            {item.icon}
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
              <p className="text-sm font-semibold tabular-nums truncate">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
      {weather.agriculturalIndices && (
        <div className="space-y-2 pt-2 border-t">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {lang === "bn" ? "কৃষি সূচক" : "Agricultural Indices"}
          </p>
          {[
            { label: "ET₀", value: `${bn(weather.agriculturalIndices.et0.toFixed(1))} mm` },
            { label: "GDD", value: bn(weather.agriculturalIndices.gdd.toFixed(1)) },
            { label: "VPD", value: bn(weather.agriculturalIndices.vaporPressureDeficit.toFixed(1)) },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium tabular-nums">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ message, icon }: { message: string; icon: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      {icon}
      <p className="text-sm text-muted-foreground text-center">{message}</p>
    </div>
  );
}

// re-export for sibling use
export { KProgress, KSeparator };
