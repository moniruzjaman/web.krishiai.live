"use client";

/**
 * risk-dashboard.tsx — KWI Risk dashboard (adapted from KWI RiskView).
 *
 * 14 risk categories + disease intelligence. Changes vs original:
 * - Bilingual category labels (Bangla first) via shared categoryBn helper.
 * - Progress → KProgress, Separator → KSeparator (no new radix deps).
 * - Bangla digits for scores.
 */

import { useState } from "react";
import type { RiskDashboard, RiskAssessment, DiseaseForecast } from "@/lib/kwi/types";
import { cn } from "@/lib/utils";
import { getRiskColor, getRiskBg, getRiskBorder, toBnDigits } from "@/lib/kwi/formatters";
import { categoryBn, riskLevelBn } from "@/components/kwi/overview";
import { KProgress, KSeparator } from "@/components/kwi/ui-bits";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShieldAlert, Thermometer, Droplets, Wind, CloudRain, Bug, Sprout,
  AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";

// --- Risk category icon & color mapping ---
const CATEGORY_META: Record<string, { icon: typeof Bug; color: string }> = {
  disease: { icon: Bug, color: "text-purple-500" },
  spray_window: { icon: CloudRain, color: "text-teal-500" },
  irrigation: { icon: Droplets, color: "text-blue-500" },
  waterlogging: { icon: Droplets, color: "text-cyan-500" },
  flood: { icon: CloudRain, color: "text-blue-700" },
  heat_stress: { icon: Thermometer, color: "text-red-500" },
  cold_stress: { icon: Thermometer, color: "text-blue-400" },
  wind_damage: { icon: Wind, color: "text-gray-500" },
  harvest: { icon: Sprout, color: "text-amber-500" },
  lodging: { icon: AlertTriangle, color: "text-orange-500" },
  pollination: { icon: Sprout, color: "text-yellow-500" },
  seedling_stress: { icon: Sprout, color: "text-green-500" },
  nutrient_loss: { icon: Droplets, color: "text-amber-700" },
  field_accessibility: { icon: ShieldAlert, color: "text-slate-500" },
};

function scoreBarClass(score: number) {
  if (score >= 75) return "bg-red-500";
  if (score >= 50) return "bg-orange-500";
  if (score >= 25) return "bg-amber-500";
  return "bg-emerald-500";
}

// --- Single Risk Card ---
function RiskCard({
  risk,
  disease,
  lang,
}: {
  risk: RiskAssessment;
  disease: DiseaseForecast | null;
  lang: "en" | "bn";
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[risk.category] ?? { icon: ShieldAlert, color: "text-gray-500" };
  const Icon = meta.icon;
  const bn = (v: string | number) => (lang === "bn" ? toBnDigits(v) : String(v));
  const diseaseRisks =
    disease?.diseases
      ?.filter(d => d.risk >= 30)
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 3) ?? [];

  return (
    <Card className={cn("border", getRiskBorder(risk.level))}>
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", meta.color)} />
            <span className="font-semibold text-sm">{categoryBn(risk.category, lang)}</span>
          </div>
          <Badge variant="outline" className={cn("text-xs font-medium", getRiskColor(risk.level))}>
            {riskLevelBn(risk.level, lang)}
          </Badge>
        </div>

        {/* Score bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{lang === "bn" ? "স্কোর" : "Score"}</span>
            <span className={cn("font-bold", getRiskColor(risk.level))}>
              {bn(risk.score)}/{lang === "bn" ? "১০০" : "100"}
            </span>
          </div>
          <KProgress value={risk.score} className="h-2" barClassName={scoreBarClass(risk.score)} />
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          aria-expanded={expanded}
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          <span>{lang === "bn" ? "বিস্তারিত" : "Details"}</span>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="space-y-3 pt-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lang === "bn" ? risk.explanationBn : risk.explanation}
            </p>

            {risk.evidence.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1">{lang === "bn" ? "প্রমাণ:" : "Evidence:"}</p>
                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                  {risk.evidence.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {risk.mitigationActions.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1">
                  {lang === "bn" ? "প্রশমন ব্যবস্থা:" : "Mitigation Actions:"}
                </p>
                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                  {(lang === "bn" ? risk.mitigationActionsBn : risk.mitigationActions).map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disease risk inline */}
            {risk.category === "disease" && diseaseRisks.length > 0 && (
              <div>
                <KSeparator className="my-2" />
                <p className="text-xs font-medium mb-1">
                  {lang === "bn" ? "শীর্ষ রোগ ঝুঁকি:" : "Top Disease Risks:"}
                </p>
                <div className="space-y-1">
                  {diseaseRisks.map(dr => (
                    <div key={dr.disease.id} className="flex items-center justify-between text-xs">
                      <span>{lang === "bn" ? dr.disease.nameBn : dr.disease.name}</span>
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {bn(dr.risk)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Main Risk Dashboard Component ---
export function RiskDashboardView({ risks, disease, lang }: {
  risks: RiskDashboard;
  disease: DiseaseForecast | null;
  lang: "en" | "bn";
}) {
  const overallColor = getRiskColor(risks.overallRiskLevel);
  const overallBg = getRiskBg(risks.overallRiskLevel);
  const overallBorder = getRiskBorder(risks.overallRiskLevel);
  const bn = (v: string | number) => (lang === "bn" ? toBnDigits(v) : String(v));

  return (
    <div className="space-y-5">
      {/* 1. Overall Risk Banner */}
      <Card className={cn("border-2", overallBorder, overallBg)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={cn("flex items-center justify-center h-14 w-14 rounded-full text-2xl font-bold", overallColor, "bg-background/60")}>
                {bn(risks.overallRiskScore)}
              </div>
              <div>
                <CardTitle className="text-lg">
                  {lang === "bn" ? "সামগ্রিক ঝুঁকি স্কোর" : "Overall Risk Score"}
                </CardTitle>
                <CardDescription>
                  {lang === "bn" ? "সকল বিভাগের সম্মিলিত ঝুঁকি মূল্যায়ন" : "Combined risk assessment across all categories"}
                </CardDescription>
              </div>
            </div>
            <Badge className={cn("text-sm px-3 py-1", overallColor, overallBg, "border", overallBorder)}>
              {riskLevelBn(risks.overallRiskLevel, lang)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mini risk indicators row */}
          <div className="flex flex-wrap gap-3">
            {risks.risks.map(r => {
              const meta = CATEGORY_META[r.category] ?? { icon: ShieldAlert, color: "text-gray-500" };
              const Icon = meta.icon;
              return (
                <div key={r.category} className="flex items-center gap-1.5 text-xs">
                  <span className={cn("h-2.5 w-2.5 rounded-full", {
                    "bg-emerald-500": r.level === "low",
                    "bg-amber-500": r.level === "moderate",
                    "bg-orange-500": r.level === "high",
                    "bg-red-500": r.level === "very_high",
                  })} />
                  <Icon className={cn("h-3 w-3", meta.color)} />
                  <span className="text-muted-foreground hidden sm:inline">{categoryBn(r.category, lang)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. Risk Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {risks.risks.map(risk => (
          <RiskCard key={risk.category} risk={risk} disease={disease} lang={lang} />
        ))}
      </div>

      {/* 3. Disease Intelligence Section */}
      {disease && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-base">
                {lang === "bn" ? "রোগ পূর্বাভাস" : "Disease Intelligence"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall favorability */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {lang === "bn" ? "সামগ্রিক রোগ অনুকূলতা" : "Overall Disease Favorability"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lang === "bn" ? "বিস্তার ঝুঁকি" : "Spread Risk"}: {riskLevelBn(disease.spreadRisk, lang)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-2xl font-bold", {
                  "text-emerald-600": disease.overallFavorability < 30,
                  "text-amber-600": disease.overallFavorability < 60,
                  "text-red-600": disease.overallFavorability >= 60,
                })}>
                  {bn(disease.overallFavorability)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {lang === "bn" ? "আত্মবিশ্বাস" : "Confidence"}: {bn(disease.confidence)}%
                </span>
              </div>
            </div>

            <KProgress
              value={disease.overallFavorability}
              className="h-2"
              barClassName={cn({
                "bg-emerald-500": disease.overallFavorability < 30,
                "bg-amber-500": disease.overallFavorability < 60,
                "bg-red-500": disease.overallFavorability >= 60,
              })}
            />

            <KSeparator />

            {/* Disease list */}
            <ScrollArea className="max-h-72">
              <div className="space-y-3">
                {disease.diseases.map(dr => (
                  <div key={dr.disease.id} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {lang === "bn" ? dr.disease.nameBn : dr.disease.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs", getRiskColor(dr.level))}>
                          {bn(dr.risk)}%
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{bn(dr.confidence)}%</span>
                      </div>
                    </div>
                    {dr.preventiveActions.length > 0 && (
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        {dr.preventiveActions.slice(0, 3).map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
