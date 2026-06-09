"use client";

/**
 * Crop Calendar Page — ফসল ক্যালেন্ডার
 *
 * Features:
 * - Visual calendar grid (12 months × 10 crops)
 * - Current season banner with active crops
 * - Risk alerts for current month
 * - Per-crop expandable detail cards
 * - Bengali-first, mobile-responsive, dark mode
 */

import { useState, useMemo } from "react";
import {
  CROP_CALENDAR,
  GREGORIAN_MONTHS,
  SEASON_COLORS,
  getCurrentCrops,
  getCurrentRiskAlerts,
} from "@/lib/cropCalendar";

// ── Bengali digit helper ──────────────────────────────────────────────────────
const bn = (n: number | string) =>
  String(Math.round(Number(n))).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

// ── Main Component ────────────────────────────────────────────────────────────
export default function CropCalendarPage() {
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const currentCrops = useMemo(() => getCurrentCrops(), []);
  const riskAlerts = useMemo(() => getCurrentRiskAlerts(), []);

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* ═══ HEADER ══════════════════════════════════════════════════════════ */}
      <div
        className="relative px-4 pt-5 pb-7"
        style={{ background: "linear-gradient(135deg,#1b4332,#2d6a4f)" }}
      >
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white dark:bg-gray-900 rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">
          CROP CALENDAR
        </div>
        <h1 className="text-[22px] font-bold text-white mb-1">
          📅 ফসল ক্যালেন্ডার
        </h1>
        <p className="text-xs text-white/70">
          বাংলাদেশের ১০টি প্রধান ফসলের মৌসুম ক্যালেন্ডার, রোগ ও পোকার ঝুঁকি সতর্কতা
        </p>
      </div>

      <div className="px-4 pt-5 pb-24">
        {/* ═══ CURRENT SEASON BANNER ═════════════════════════════════════════ */}
        <div className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 border border-cyan-200 dark:border-cyan-800 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-pulse" />
            <span className="text-[12px] font-bold text-cyan-700 dark:text-cyan-400">
              চলতি মাস — {GREGORIAN_MONTHS[currentMonth - 1]?.bn}
            </span>
          </div>
          <div className="text-[11px] text-gray-600 dark:text-gray-400 mb-2">
            এই মাসে সক্রিয় ফসল
          </div>
          <div className="flex flex-wrap gap-2">
            {currentCrops.map((c) => (
              <span
                key={c.crop}
                className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-full px-2.5 py-1 border border-cyan-200 dark:border-cyan-700"
              >
                <span className="text-base">{c.icon}</span>
                <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">
                  {c.crop}
                </span>
                <span className="text-[9px] text-gray-500 dark:text-gray-400">
                  {c.activeSeasons.map((s) => s.name).join(", ")}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* ═══ RISK ALERTS ═══════════════════════════════════════════════════ */}
        {riskAlerts.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">⚠️</span>
              <span className="text-[12px] font-bold text-red-700 dark:text-red-400">
                ঝুঁকি সতর্কতা — {GREGORIAN_MONTHS[currentMonth - 1]?.bn}
              </span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {riskAlerts.map((alert, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-red-100 dark:border-red-900"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{alert.icon}</span>
                    <span className="text-[11px] font-bold text-gray-900 dark:text-gray-100">
                      {alert.crop}
                    </span>
                    <span className="text-[9px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-full font-medium">
                      {alert.season}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-red-600 dark:text-red-400">রোগ:</span>{" "}
                    {alert.keyDiseases.join(", ")}
                  </div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-orange-600 dark:text-orange-400">পোকা:</span>{" "}
                    {alert.keyPests.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ VISUAL CALENDAR GRID ═════════════════════════════════════════ */}
        <div className="mb-4">
          <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">
            🗓️ বার্ষিক ফসল ক্যালেন্ডার
          </div>

          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[9px] font-bold text-gray-500 dark:text-gray-400 p-1 w-16 sticky left-0 bg-white dark:bg-gray-900 z-10">
                    ফসল
                  </th>
                  {GREGORIAN_MONTHS.map((m, i) => (
                    <th
                      key={i}
                      className={`text-center text-[8px] font-bold p-1 ${
                        i + 1 === currentMonth
                          ? "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      <div>{m.short}</div>
                      {i + 1 === currentMonth && (
                        <div className="w-1 h-1 bg-cyan-500 rounded-full mx-auto mt-0.5" />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CROP_CALENDAR.map((crop) => (
                  <tr key={crop.crop}>
                    <td className="p-1 sticky left-0 bg-white dark:bg-gray-900 z-10">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{crop.icon}</span>
                        <span className="text-[9px] font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                          {crop.crop}
                        </span>
                      </div>
                    </td>
                    {Array.from({ length: 12 }, (_, mi) => {
                      const month = mi + 1;
                      const activeSeason = crop.seasons.find((s) =>
                        s.months.includes(month)
                      );
                      const isCurrent = month === currentMonth;

                      if (activeSeason) {
                        const colors = SEASON_COLORS[activeSeason.name];
                        return (
                          <td
                            key={mi}
                            className={`p-0.5 text-center ${isCurrent ? "ring-2 ring-cyan-400 ring-inset" : ""}`}
                          >
                            <div
                              className="rounded-[3px] h-6 flex items-center justify-center text-[7px] font-bold"
                              style={{
                                backgroundColor: colors?.bg,
                                color: colors?.text,
                              }}
                              title={`${crop.crop} — ${activeSeason.name} (${activeSeason.nameEn})`}
                            >
                              {isCurrent ? "●" : ""}
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={mi}
                          className={`p-0.5 ${isCurrent ? "bg-cyan-50/50 dark:bg-cyan-900/10" : ""}`}
                        >
                          <div className="h-6" />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Season legend */}
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(SEASON_COLORS).map(([name, colors]) => (
              <div key={name} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-[2px]"
                  style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
                />
                <span className="text-[9px] text-gray-600 dark:text-gray-400 font-medium">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ CROP DETAIL CARDS ════════════════════════════════════════════ */}
        <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">
          🌾 ফসলের বিস্তারিত তথ্য
        </div>

        <div className="space-y-2">
          {CROP_CALENDAR.map((crop) => {
            const isExpanded = expandedCrop === crop.crop;
            const isActive = currentCrops.some((c) => c.crop === crop.crop);

            return (
              <div
                key={crop.crop}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}
              >
                {/* Card header — always visible */}
                <button
                  onClick={() =>
                    setExpandedCrop(isExpanded ? null : crop.crop)
                  }
                  className="w-full flex items-center gap-3 p-3.5 cursor-pointer bg-transparent border-none text-left"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{
                      backgroundColor: crop.color + "20",
                    }}
                  >
                    {crop.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold text-gray-900 dark:text-gray-100">
                        {crop.crop}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {crop.cropEn}
                      </span>
                      {isActive && (
                        <span className="text-[8px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                          সক্রিয়
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {crop.seasons.map((s) => s.name).join(" · ")}
                    </div>
                  </div>
                  <span
                    className={`text-gray-400 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-0 border-t border-gray-100 dark:border-gray-700">
                    {crop.seasons.map((season, si) => {
                      const colors = SEASON_COLORS[season.name];
                      const isCurrentSeason = season.months.includes(currentMonth);

                      return (
                        <div
                          key={si}
                          className="mt-3 rounded-xl p-3"
                          style={{
                            backgroundColor: colors
                              ? colors.bg + "60"
                              : "#f9fafb",
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: colors?.bg,
                                color: colors?.text,
                              }}
                            >
                              {season.name}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                              {season.nameEn}
                            </span>
                            {isCurrentSeason && (
                              <span className="text-[8px] font-bold bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 px-1.5 py-0.5 rounded-full">
                                চলমান
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">
                                🌱 বপন:
                              </span>{" "}
                              <span className="font-medium text-gray-800 dark:text-gray-200">
                                {season.plantMonth}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">
                                🌾 ফসল:
                              </span>{" "}
                              <span className="font-medium text-gray-800 dark:text-gray-200">
                                {season.harvestMonth}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">
                                ⚠️ ঝুঁকি:
                              </span>{" "}
                              <span className="font-medium text-red-700 dark:text-red-400">
                                {season.riskPeriod}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">
                                📅 মাস:
                              </span>{" "}
                              <span className="font-medium text-gray-800 dark:text-gray-200">
                                {season.months.map((m) => bn(m)).join(", ")}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div>
                              <div className="text-[9px] font-bold text-red-600 dark:text-red-400 mb-0.5">
                                🦠 প্রধান রোগ
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {season.keyDiseases.map((d, di) => (
                                  <span
                                    key={di}
                                    className="text-[9px] bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-full"
                                  >
                                    {d}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-[9px] font-bold text-orange-600 dark:text-orange-400 mb-0.5">
                                🐛 প্রধান পোকা
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {season.keyPests.map((p, pi) => (
                                  <span
                                    key={pi}
                                    className="text-[9px] bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded-full"
                                  >
                                    {p}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-[9px] font-bold text-green-600 dark:text-green-400 mb-0.5">
                                💡 চাষ পরামর্শ
                              </div>
                              <ul className="space-y-0.5">
                                {season.tips.map((t, ti) => (
                                  <li
                                    key={ti}
                                    className="text-[9px] text-gray-700 dark:text-gray-300 flex items-start gap-1"
                                  >
                                    <span className="text-green-500 mt-0.5">
                                      ✓
                                    </span>
                                    {t}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ═══ INFO FOOTER ══════════════════════════════════════════════════ */}
        <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-[12px] font-bold text-gray-700 dark:text-gray-300 mb-2">
            ℹ️ তথ্যসূত্র
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed space-y-1">
            <p>
              • বাংলাদেশ কৃষি গবেষণা ইনস্টিটিউট (BARI) ও DAE এর তথ্য ভিত্তিক
            </p>
            <p>
              • মৌসুম ও রোগের তথ্য সাধারণ নির্দেশিকা — স্থানীয় পরামর্শ গুরুত্বপূর্ণ
            </p>
            <p>• ফসলের জাত ও অঞ্চল অনুযায়ী মৌসুম ভিন্ন হতে পারে</p>
          </div>
        </div>
      </div>
    </div>
  );
}
