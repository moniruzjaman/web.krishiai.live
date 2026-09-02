"use client";

import type { CSSProperties } from "react";
/**
 * crop-calendar.tsx — KWI Crop Calendar (adapted from KWI CropCalendarView).
 *
 * Changes vs original:
 * - Active crop comes via props (single selected crop from useActiveCrop)
 *   instead of the KWI zustand store.
 * - Progress → KProgress (no new radix deps).
 * - Bangla digits / Bangla stage names (Bangla first).
 */

import type { CropCalendarEntry, WeatherData, ActiveCrop } from "@/lib/kwi/types";
import { getCropConfig } from "@/lib/kwi/engines/crop-configs";
import { getCropProgress, getExpectedHarvestDate } from "@/lib/kwi/engines/calendar-engine";
import { cn } from "@/lib/utils";
import { toBnDigits } from "@/lib/kwi/formatters";
import { KProgress } from "@/components/kwi/ui-bits";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sprout, Clock, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";

// --- Helpers ---
function formatDate(dateStr: string, lang: "en" | "bn"): string {
  const d = new Date(dateStr + "T00:00:00");
  if (lang === "bn") {
    const monthsBn = ["জানু", "ফেব", "মার্চ", "এপ্রি", "মে", "জুন", "জুল", "আগ", "সেপ", "অক্টো", "নভে", "ডিসে"];
    return `${monthsBn[d.getMonth()]} ${toBnDigits(d.getDate())}`;
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDayName(dateStr: string, lang: "en" | "bn"): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date().toISOString().split("T")[0];
  if (dateStr === today) return lang === "bn" ? "আজ" : "Today";
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  if (dateStr === tomorrow) return lang === "bn" ? "আগামীকাল" : "Tomorrow";
  if (lang === "bn") {
    const weekdaysBn = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];
    return weekdaysBn[d.getDay()];
  }
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function getStageName(stageId: string, stages: { id: string; name: string; nameBn: string }[], lang: "en" | "bn") {
  const stage = stages.find(s => s.id === stageId);
  return stage ? (lang === "bn" ? stage.nameBn : stage.name) : stageId;
}

function getStageAbbrev(stageId: string, lang: "en" | "bn"): string {
  if (lang === "bn") {
    const abbrevsBn: Record<string, string> = {
      sowing: "বপন", germination: "অঙ্কুর", seedling: "চারা", vegetative: "বৃদ্ধি",
      tillering: "কুশপ", stem_elongation: "কাণ্ড", booting: "শীষ", heading: "শীষোদ্গম",
      flowering: "ফুল", grain_filling: "দানা", dough: "সসীম", ripening: "পাকা", harvest: "কাটা",
    };
    return abbrevsBn[stageId] ?? stageId.slice(0, 4);
  }
  const abbrevs: Record<string, string> = {
    sowing: "Sow", germination: "Germ", seedling: "Seed", vegetative: "Veg",
    tillering: "Till", stem_elongation: "Stem", booting: "Boot", heading: "Head",
    flowering: "Flwr", grain_filling: "GrnF", dough: "Dgh", ripening: "Rip", harvest: "Hrv",
  };
  return abbrevs[stageId] ?? stageId.slice(0, 4);
}

// --- Growth Stage Timeline ---
function GrowthTimeline({
  cropId,
  currentStageId,
  progress,
  lang,
}: {
  cropId: string;
  currentStageId: string;
  progress: number;
  lang: "en" | "bn";
}) {
  const config = getCropConfig(cropId);
  const totalDays = config.totalDurationDays;
  const passedDays = Math.round((progress / 100) * totalDays);

  return (
    <div className="flex w-full h-8 rounded-md overflow-hidden bg-muted/50">
      {config.growthStages.map(stage => {
        const widthPct = (stage.durationDays / totalDays) * 100;
        const isCurrent = stage.id === currentStageId;
        const isPast = !isCurrent && passedDays > 0;

        return (
          <div
            key={stage.id}
            title={`${lang === "bn" ? stage.nameBn : stage.name} (${stage.durationDays}d)`}
            className={cn(
              "flex items-center justify-center text-[10px] font-medium border-r border-background/20 transition-colors last:border-r-0",
              isCurrent && "bg-primary text-primary-foreground",
              isPast && !isCurrent && "bg-primary/20 text-primary/70",
              !isPast && !isCurrent && "bg-muted text-muted-foreground",
            )}
            style={{ width: `${widthPct}%`, minWidth: widthPct > 4 ? undefined : "2px" }}
          >
            {widthPct > 6 ? getStageAbbrev(stage.id, lang) : ""}
          </div>
        );
      })}
    </div>
  );
}

// --- Main Crop Calendar Component ---
export function CropCalendarView({ calendar, weather, lang, crop }: {
  calendar: CropCalendarEntry[];
  weather: WeatherData | null;
  lang: "en" | "bn";
  crop: ActiveCrop;
}) {
  const bn = (v: string | number) => (lang === "bn" ? toBnDigits(v) : String(v));
  const config = getCropConfig(crop.cropId);
  const progress = getCropProgress(crop);
  const harvestDate = getExpectedHarvestDate(crop);

  const today = new Date().toISOString().split("T")[0];
  const cropEntries = calendar.filter(e => e.date === today);
  const todayEntry = cropEntries.find(e => e.stage === crop.currentStage) ?? cropEntries[0];

  // 7-day outlook dates
  const outlookDates: string[] = [];
  for (let d = 0; d < 7; d++) {
    const dt = new Date();
    dt.setDate(dt.getDate() + d);
    outlookDates.push(dt.toISOString().split("T")[0]);
  }

  return (
    <div className="space-y-5">
      {/* Active crop card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{config.icon}</span>
              <div>
                <CardTitle className="text-base">{lang === "bn" ? config.nameBn : config.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {lang === "bn" ? "বপন" : "Planted"}: {formatDate(crop.sowingDate, lang)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: config.color }} />
              <span className="text-sm font-medium">{bn(Math.round(progress))}%</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{lang === "bn" ? "অগ্রগতি" : "Progress"}</span>
              <span>{bn(Math.round(progress))}%</span>
            </div>
            <KProgress
              value={progress}
              className="h-2"
              barClassName="bg-[var(--kwi-crop-color)]"
              style={{ "--kwi-crop-color": config.color } as CSSProperties}
            />
          </div>

          {/* Growth Stage Timeline */}
          <GrowthTimeline cropId={crop.cropId} currentStageId={todayEntry?.stage ?? crop.currentStage} progress={progress} lang={lang} />

          {/* Current stage info */}
          {todayEntry && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Sprout className="h-4 w-4 text-primary" />
                <span className="font-medium">{getStageName(todayEntry.stage, config.growthStages, lang)}</span>
              </div>
              <span className="text-muted-foreground text-xs">
                <Clock className="h-3 w-3 inline mr-1" />
                {lang === "bn" ? "দিন" : "Day"} {bn(todayEntry.dayInStage)}/{bn(stageDuration(config, todayEntry.stage))}
              </span>
            </div>
          )}

          {/* Planting & harvest dates */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{lang === "bn" ? "বপন:" : "Planted:"} {formatDate(crop.sowingDate, lang)}</span>
            <span>{lang === "bn" ? "ফসল কাটা:" : "Harvest:"} {formatDate(harvestDate, lang)}</span>
          </div>

          {/* Delayed warning */}
          {todayEntry?.isDelayed && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-xs text-amber-700 dark:text-amber-300">
                {lang === "bn" ? "কিছু কাজ বিলম্বিত হয়েছে" : "Some tasks are delayed"}
              </span>
            </div>
          )}

          {/* Today's tasks */}
          {todayEntry && todayEntry.tasks.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {lang === "bn" ? "আজকের কাজ" : "Today's Tasks"}
              </p>
              {todayEntry.tasks.map(task => {
                const isCompleted = todayEntry.completedTasks.includes(task.id);
                return (
                  <div key={task.id} className="flex items-start gap-2 text-sm">
                    {isCompleted
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
                    <div>
                      <span className={cn(isCompleted && "line-through text-muted-foreground")}>
                        {lang === "bn" ? task.nameBn : task.name}
                      </span>
                      {task.priority === "critical" && (
                        <Badge variant="destructive" className="ml-2 text-[10px] h-4 px-1">
                          {lang === "bn" ? "জরুরি" : "Critical"}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Weather adjustments */}
          {todayEntry && todayEntry.weatherAdjustments.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {lang === "bn" ? "আবহাওয়া সমন্বয়" : "Weather Adjustments"}
              </p>
              {todayEntry.weatherAdjustments.map((adj, i) => (
                <p key={i} className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  {adj}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 7-Day Outlook */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {lang === "bn" ? "৭ দিনের কৃষি পরিকল্পনা" : "7-Day Crop Outlook"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-80">
            <div className="space-y-3">
              {outlookDates.map(dateStr => {
                const entry = calendar.find(e => e.date === dateStr) ?? inferEntry(crop, dateStr);
                if (!entry) return null;

                // Weather for this day
                const dayIndex = outlookDates.indexOf(dateStr);
                const dayWeather = weather?.daily[dayIndex];

                return (
                  <div key={dateStr} className="flex items-start gap-3 py-2 border-b last:border-b-0">
                    <div className="w-16 shrink-0">
                      <p className="text-sm font-medium">{getDayName(dateStr, lang)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(dateStr, lang)}</p>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm">
                        {getStageName(entry.stage, config.growthStages, lang)}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({lang === "bn" ? "দিন" : "D"}{bn(entry.dayOverall)})
                        </span>
                      </p>
                      {dayWeather && (
                        <p className="text-xs text-muted-foreground">
                          {bn(Math.round(dayWeather.tempMin))}°–{bn(Math.round(dayWeather.tempMax))}°C
                          {dayWeather.precipitationSum > 0 && ` · ${bn(dayWeather.precipitationSum.toFixed(1))}mm`}
                        </p>
                      )}
                      {entry.weatherAdjustments.map((adj, i) => (
                        <p key={i} className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />{adj}
                        </p>
                      ))}
                      {entry.tasks.map(task => (
                        <p key={task.id} className="text-xs flex items-center gap-1">
                          <ChevronRight className="h-3 w-3 text-primary" />
                          {lang === "bn" ? task.nameBn : task.name}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Utils ---
function stageDuration(config: ReturnType<typeof getCropConfig>, stageId: string): number {
  return config.growthStages.find(s => s.id === stageId)?.durationDays ?? 0;
}

/** Infer a minimal calendar entry for dates beyond the generated calendar. */
function inferEntry(crop: ActiveCrop, dateStr: string): CropCalendarEntry {
  const config = getCropConfig(crop.cropId);
  const sowing = new Date(crop.sowingDate);
  const target = new Date(dateStr + "T00:00:00");
  const dayOverall = Math.floor((target.getTime() - sowing.getTime()) / 86400000);
  let acc = 0;
  let stageId = config.growthStages[0].id;
  let dayInStage = 0;
  for (const stage of config.growthStages) {
    if (dayOverall < acc + stage.durationDays) {
      stageId = stage.id;
      dayInStage = dayOverall - acc;
      break;
    }
    acc += stage.durationDays;
  }
  return {
    date: dateStr,
    stage: stageId as CropCalendarEntry["stage"],
    dayInStage: Math.max(0, dayInStage),
    dayOverall: Math.max(0, dayOverall),
    tasks: [],
    weatherAdjustments: [],
    marketAdjustments: [],
    isDelayed: false,
    completedTasks: [],
  };
}
