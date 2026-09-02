/**
 * mini-charts.tsx — Lightweight dependency-free SVG charts for KWI.
 *
 * Replaces the recharts AreaChart / ComposedChart used by the original
 * KWI weather view so the integration adds ZERO new npm dependencies.
 * Charts render a responsive SVG with gradient area fills, grid lines
 * and axis labels — mobile-first and Bangla-digit aware.
 */

"use client";

import { useId } from "react";

export interface HourlyPoint {
  label: string;
  temp: number;
  rain: number;
}

export interface DailyPoint {
  label: string;
  tempMax: number;
  tempMin: number;
  rainProb: number;
}

/** Convert western digits to Bangla digits when lang is "bn". */
export function bnNum(value: number | string, lang: "bn" | "en"): string {
  const s = String(value);
  if (lang !== "bn") return s;
  return s.replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
}

// ── 24h temperature + rain area chart ────────────────────────────────────────
export function HourlyAreaChart({
  data,
  lang,
  height = 200,
}: {
  data: HourlyPoint[];
  lang: "bn" | "en";
  height?: number;
}) {
  const uid = useId().replace(/[:]/g, "");
  const W = 720;
  const H = height;
  const padX = 34;
  const padTop = 14;
  const padBottom = 26;

  if (data.length < 2) return null;

  const temps = data.map((d) => d.temp);
  const maxT = Math.max(...temps) + 1;
  const minT = Math.min(...temps) - 1;
  const maxRain = Math.max(...data.map((d) => d.rain), 1);

  const x = (i: number) => padX + (i / (data.length - 1)) * (W - padX - 8);
  const yT = (v: number) =>
    padTop + (1 - (v - minT) / (maxT - minT || 1)) * (H - padTop - padBottom);
  const yR = (v: number) =>
    padTop + (1 - v / maxRain) * (H - padTop - padBottom) * 0.5;

  const tempPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${yT(d.temp).toFixed(1)}`)
    .join(" ");
  const tempArea = `${tempPath} L${x(data.length - 1).toFixed(1)},${H - padBottom} L${padX},${H - padBottom} Z`;
  const rainPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${yR(d.rain).toFixed(1)}`)
    .join(" ");

  const tickEvery = Math.ceil(data.length / 6);
  const minLabel = lang === "bn" ? "সর্বনিম্ন" : "Min";
  const maxLabel = lang === "bn" ? "সর্বোচ্চ" : "Max";

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={lang === "bn" ? "২৪ ঘণ্টার তাপমাত্রা ও বৃষ্টিপাত" : "24h temperature and rain"}
      >
        <defs>
          <linearGradient id={`tg-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* grid */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={W - 8}
            y1={padTop + f * (H - padTop - padBottom)}
            y2={padTop + f * (H - padTop - padBottom)}
            stroke="currentColor"
            className="text-muted-foreground/15"
            strokeDasharray="3 4"
          />
        ))}

        {/* rain area */}
        <path
          d={`${rainPath} L${x(data.length - 1)},${H - padBottom} L${padX},${H - padBottom} Z`}
          fill="#3b82f6"
          opacity="0.12"
        />
        <path d={rainPath} fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.6" />

        {/* temperature area */}
        <path d={tempArea} fill={`url(#tg-${uid})`} />
        <path d={tempPath} fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinejoin="round" />

        {/* hot/cold markers */}
        <circle cx={x(temps.indexOf(Math.max(...temps)))} cy={yT(maxT - 1)} r="0" />
        <text
          x={x(temps.indexOf(Math.max(...temps)))}
          y={yT(Math.max(...temps)) - 8}
          textAnchor="middle"
          className="fill-orange-500"
          fontSize="11"
          fontWeight="600"
        >
          {bnNum(Math.round(maxT - 1), lang)}°
        </text>
        <text
          x={x(temps.indexOf(Math.min(...temps)))}
          y={yT(Math.min(...temps)) + 16}
          textAnchor="middle"
          className="fill-blue-500"
          fontSize="11"
          fontWeight="600"
        >
          {bnNum(Math.round(minT + 1), lang)}°
        </text>

        {/* x labels */}
        {data.map((d, i) =>
          i % tickEvery === 0 ? (
            <text
              key={i}
              x={x(i)}
              y={H - 8}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize="10"
            >
              {d.label}
            </text>
          ) : null,
        )}
      </svg>
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-600" />
          {lang === "bn" ? "তাপমাত্রা (°C)" : "Temperature (°C)"}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          {lang === "bn" ? "বৃষ্টিপাত (mm)" : "Rain (mm)"}
        </span>
        <span>
          {maxLabel} {bnNum(Math.round(maxT - 1), lang)}° · {minLabel} {bnNum(Math.round(minT + 1), lang)}°
        </span>
      </div>
    </div>
  );
}

// ── 7-day min/max bars + rain-probability line ───────────────────────────────
export function DailyRangeChart({
  data,
  lang,
  height = 190,
}: {
  data: DailyPoint[];
  lang: "bn" | "en";
  height?: number;
}) {
  const W = 720;
  const H = height;
  const padX = 30;
  const padTop = 16;
  const padBottom = 26;

  if (data.length === 0) return null;

  const all = data.flatMap((d) => [d.tempMax, d.tempMin]);
  const maxT = Math.max(...all) + 1;
  const minT = Math.min(...all) - 1;
  const slot = (W - padX - 10) / data.length;
  const barW = Math.min(18, slot * 0.32);

  const yT = (v: number) =>
    padTop + (1 - (v - minT) / (maxT - minT || 1)) * (H - padTop - padBottom);

  const rainLine = data
    .map((d, i) => {
      const cx = padX + slot * i + slot / 2;
      const cy = padTop + (1 - d.rainProb / 100) * (H - padTop - padBottom);
      return `${i === 0 ? "M" : "L"}${cx.toFixed(1)},${cy.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={lang === "bn" ? "৭ দিনের পূর্বাভাস" : "7-day forecast"}
      >
        {[0.33, 0.66].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={W - 10}
            y1={padTop + f * (H - padTop - padBottom)}
            y2={padTop + f * (H - padTop - padBottom)}
            stroke="currentColor"
            className="text-muted-foreground/15"
            strokeDasharray="3 4"
          />
        ))}

        {data.map((d, i) => {
          const cx = padX + slot * i + slot / 2;
          return (
            <g key={i}>
              {/* max bar */}
              <rect
                x={cx - barW - 1}
                y={yT(d.tempMax)}
                width={barW}
                height={H - padBottom - yT(d.tempMax)}
                rx="3"
                className="fill-orange-400/80"
              />
              {/* min bar */}
              <rect
                x={cx + 1}
                y={yT(d.tempMin)}
                width={barW}
                height={H - padBottom - yT(d.tempMin)}
                rx="3"
                className="fill-blue-400/70"
              />
              {/* labels */}
              <text
                x={cx}
                y={yT(d.tempMax) - 5}
                textAnchor="middle"
                className="fill-orange-500"
                fontSize="10"
                fontWeight="600"
              >
                {bnNum(Math.round(d.tempMax), lang)}°
              </text>
              <text
                x={cx}
                y={yT(d.tempMin) + 12}
                textAnchor="middle"
                className="fill-blue-500"
                fontSize="10"
                fontWeight="600"
              >
                {bnNum(Math.round(d.tempMin), lang)}°
              </text>
              <text
                x={cx}
                y={H - 8}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize="10"
              >
                {d.label}
              </text>
            </g>
          );
        })}

        {/* rain probability line */}
        <path
          d={rainLine}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="2"
          strokeDasharray="5 3"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-orange-400" />
          {lang === "bn" ? "সর্বোচ্চ" : "High"}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          {lang === "bn" ? "সর্বনিম্ন" : "Low"}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          {lang === "bn" ? "বৃষ্টির সম্ভাবনা (%)" : "Rain Prob (%)"}
        </span>
      </div>
    </div>
  );
}
