"use client";

/**
 * weather-details.tsx — KWI Weather details (adapted from KWI WeatherView).
 *
 * Changes vs original:
 * - recharts replaced by dependency-free SVG mini-charts (HourlyAreaChart /
 *   DailyRangeChart) — zero new npm dependencies.
 * - Progress → KProgress.
 * - All numerals, times, days and wind directions render in Bangla when
 *   lang === "bn" (Bangla first).
 */

import { useMemo } from "react";
import type { WeatherData } from "@/lib/kwi/types";
import {
  formatTemperature,
  formatPercent,
  formatSpeed,
  formatPressure,
  formatVisibility,
  formatRain,
  getWeatherIcon,
  getWindDirection,
  getTimeLabel,
  getDayLabel,
  toBnDigits,
} from "@/lib/kwi/formatters";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HourlyAreaChart, DailyRangeChart } from "@/components/kwi/mini-charts";
import type { HourlyPoint, DailyPoint } from "@/components/kwi/mini-charts";

import {
  Droplets, Wind, Gauge, Sun, CloudRain, Eye,
  Thermometer, Sprout, Leaf, Waves, Zap, CalendarDays, CloudSun,
} from "lucide-react";

interface WeatherViewProps {
  weather: WeatherData;
  lang: "en" | "bn";
}

// ── Agricultural index metadata ──────────────────────────────────────────────
const agriLabels = {
  et0: { en: "Reference Evapotranspiration", bn: "রেফারেন্স বাষ্পীভবন", icon: Droplets, unit: "mm/day", max: 10 },
  gdd: { en: "Growing Degree Days", bn: "বৃদ্ধি ডিগ্রি দিন", icon: Sprout, unit: "°C·d", max: 30 },
  hni: { en: "Heat Stress Index", bn: "তাপ প্রাণী সূচক", icon: Thermometer, unit: "", max: 100 },
  cni: { en: "Cold Stress Index", bn: "শীত প্রাণী সূচক", icon: CloudRain, unit: "", max: 100 },
  leafWetness: { en: "Leaf Wetness Hours", bn: "পাতা ভেজা ঘণ্টা", icon: Leaf, unit: "hrs", max: 24 },
  soilMoistureDeficit: { en: "Soil Moisture Deficit", bn: "মাটির আর্দ্রতা ঘাটতি", icon: Waves, unit: "mm", max: 100 },
  vpd: { en: "Vapor Pressure Deficit", bn: "বাষ্প চাপ ঘাটতি", icon: Wind, unit: "kPa", max: 5 },
  solarRadiation: { en: "Solar Radiation", bn: "সৌর বিকিরণ", icon: Zap, unit: "W/m²", max: 1000 },
} as const;

export function WeatherDetails({ weather, lang }: WeatherViewProps) {
  const { current, hourly, daily, agriculturalIndices, location } = weather;
  const next24 = hourly.slice(0, 24);
  const days7 = daily.slice(0, 7);
  const days14 = daily.slice(7, 14);
  const bn = (v: string | number) => (lang === "bn" ? toBnDigits(v) : String(v));

  // Chart data transforms
  const hourlyChartData = useMemo<HourlyPoint[]>(
    () =>
      next24.map(h => ({
        label: getTimeLabel(h.time, lang),
        temp: Math.round(h.temperature * 10) / 10,
        rain: Math.round(h.precipitation * 100) / 100,
      })),
    [next24, lang],
  );

  const dailyChartData = useMemo<DailyPoint[]>(
    () =>
      days7.map(d => ({
        label: getDayLabel(d.date, lang).split(",")[0],
        tempMax: d.tempMax,
        tempMin: d.tempMin,
        rainProb: d.precipitationProbabilityMax,
      })),
    [days7, lang],
  );

  // Current condition metrics
  const metrics = [
    { icon: Droplets, label: lang === "bn" ? "আর্দ্রতা" : "Humidity", value: bn(formatPercent(current.humidity)), color: "text-blue-500" },
    { icon: Wind, label: lang === "bn" ? "বাতাস" : "Wind", value: `${bn(formatSpeed(current.windSpeed))} ${getWindDirection(current.windDirection, lang)}`, color: "text-cyan-500" },
    { icon: Gauge, label: lang === "bn" ? "চাপ" : "Pressure", value: bn(formatPressure(current.pressure)), color: "text-violet-500" },
    { icon: Sun, label: lang === "bn" ? "ইউভি সূচক" : "UV Index", value: bn(current.uvIndex.toFixed(1)), color: "text-amber-500" },
    { icon: CloudRain, label: lang === "bn" ? "শিশিরবিন্দু" : "Dew Point", value: formatTemperature(current.dewPoint, lang), color: "text-sky-400" },
    { icon: Eye, label: lang === "bn" ? "দৃশ্যমানতা" : "Visibility", value: bn(formatVisibility(current.visibility)), color: "text-emerald-500" },
  ];

  // Agricultural entries
  const agriEntries: { key: keyof typeof agriLabels; value: number }[] = [
    { key: "et0", value: agriculturalIndices.et0 },
    { key: "gdd", value: agriculturalIndices.gdd },
    { key: "hni", value: agriculturalIndices.hni },
    { key: "cni", value: agriculturalIndices.cni },
    { key: "leafWetness", value: agriculturalIndices.leafWetnessHours },
    { key: "soilMoistureDeficit", value: agriculturalIndices.soilMoistureDeficit },
    { key: "vpd", value: agriculturalIndices.vaporPressureDeficit },
    { key: "solarRadiation", value: agriculturalIndices.solarRadiation },
  ];

  return (
    <div className="space-y-4">
      {/* ── Current Weather Card ────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {location.name}{location.district ? `, ${location.district}` : ""}
              </p>
              <div className="flex items-end gap-3 mt-2">
                <span className="text-6xl font-bold tracking-tighter">
                  {formatTemperature(current.temperature, lang)}
                </span>
                <span className="text-4xl mb-1">{getWeatherIcon(current.weatherCode, current.isDay)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                {lang === "bn" ? "অনুভূত" : "Feels like"} {formatTemperature(current.feelsLike, lang)}
                {current.precipitationProbability > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <CloudRain className="w-3 h-3 mr-1" />
                    {bn(formatPercent(current.precipitationProbability))}
                  </Badge>
                )}
              </p>
            </div>
          </div>

          {/* 2×3 Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
            {metrics.map(m => (
              <div key={m.label} className="flex items-center gap-2.5 rounded-lg bg-muted/50 p-3">
                <m.icon className={cn("w-4 h-4 shrink-0", m.color)} />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{m.label}</p>
                  <p className="text-sm font-semibold truncate">{m.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <Tabs defaultValue="hourly" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="hourly">{lang === "bn" ? "২৪ ঘণ্টা" : "Hourly"}</TabsTrigger>
          <TabsTrigger value="7day">{lang === "bn" ? "৭ দিন" : "7-Day"}</TabsTrigger>
          <TabsTrigger value="agri">{lang === "bn" ? "কৃষি" : "Agri"}</TabsTrigger>
          <TabsTrigger value="14day">{lang === "bn" ? "১৪ দিন" : "14-Day"}</TabsTrigger>
        </TabsList>

        {/* ── Hourly (24h) Tab ──────────────────────────────── */}
        <TabsContent value="hourly">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                {lang === "bn" ? "পরবর্তী ২৪ ঘণ্টা" : "Next 24 Hours"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HourlyAreaChart data={hourlyChartData} lang={lang} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 7-Day Tab ─────────────────────────────────────── */}
        <TabsContent value="7day">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                {lang === "bn" ? "৭ দিনের পূর্বাভাস" : "7-Day Forecast"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Weather icons row */}
              <div className="flex justify-around mb-3">
                {days7.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5 text-xs min-w-0">
                    <span className="text-muted-foreground font-medium truncate">
                      {getDayLabel(d.date, lang).split(",")[0]}
                    </span>
                    <span className="text-xl leading-none">{getWeatherIcon(d.weatherCode)}</span>
                  </div>
                ))}
              </div>
              <DailyRangeChart data={dailyChartData} lang={lang} />
              {/* Rain totals row */}
              <div className="flex justify-around mt-2 text-xs text-muted-foreground">
                {days7.map((d, i) => (
                  <span key={i} className="min-w-0 text-center truncate">
                    {d.precipitationSum > 0 ? bn(formatRain(d.precipitationSum)) : "—"}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Agricultural Indices Tab ──────────────────────── */}
        <TabsContent value="agri">
          <div className="grid grid-cols-2 gap-3">
            {agriEntries.map(({ key, value }) => {
              const meta = agriLabels[key];
              const Icon = meta.icon;
              const isHeatStress = key === "hni" && value > 50;
              const isColdStress = key === "cni" && value > 30;
              const pct = Math.min(100, (value / meta.max) * 100);

              return (
                <Card key={key}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon
                        className={cn(
                          "w-4 h-4",
                          isHeatStress ? "text-red-500" : isColdStress ? "text-blue-500" : "text-muted-foreground",
                        )}
                      />
                      <span className="text-xs text-muted-foreground leading-tight">
                        {lang === "bn" ? meta.bn : meta.en}
                      </span>
                    </div>
                    <p className={cn("text-xl font-bold", isHeatStress && "text-red-500", isColdStress && "text-blue-500")}>
                      {value != null ? bn(Number.isInteger(value) ? value : value.toFixed(1)) : "—"}
                      {meta.unit && (
                        <span className="text-xs font-normal text-muted-foreground ml-1">{meta.unit}</span>
                      )}
                    </p>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isHeatStress ? "bg-red-500" : isColdStress ? "bg-blue-500" : "bg-emerald-500",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── Extended (14-day) Tab ─────────────────────────── */}
        <TabsContent value="14day">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                {lang === "bn" ? "বর্ধিত ১৪ দিনের পূর্বাভাস" : "Extended 14-Day Forecast"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[340px]">
                <div className="divide-y">
                  {days14.map((d, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl">{getWeatherIcon(d.weatherCode)}</span>
                        <div className="min-w-0">
                          <span className="text-sm font-medium block truncate">{getDayLabel(d.date, lang)}</span>
                          <span className="text-xs text-muted-foreground">{bn(formatRain(d.precipitationSum))}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant="outline" className="text-xs gap-1">
                          <CloudRain className="w-3 h-3" />
                          {bn(formatPercent(d.precipitationProbabilityMax))}
                        </Badge>
                        <span className="text-sm font-semibold w-12 text-right text-rose-500">
                          {formatTemperature(d.tempMax, lang)}
                        </span>
                        <span className="text-sm w-12 text-right text-blue-400">
                          {formatTemperature(d.tempMin, lang)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {days14.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {lang === "bn" ? "বর্ধিত পূর্বাভাস ডেটা পাওয়া যায়নি" : "No extended forecast data available"}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Footer ──────────────────────────────────────────── */}
      <p className="text-[11px] text-muted-foreground text-center pb-2 flex items-center justify-center gap-1">
        <CloudSun className="h-3 w-3" />
        {lang === "bn" ? "সর্বশেষ আপডেট" : "Last updated"}:{" "}
        {bn(new Date(weather.fetchedAt).toLocaleString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          day: "numeric",
          month: "short",
        }))}
      </p>
    </div>
  );
}
