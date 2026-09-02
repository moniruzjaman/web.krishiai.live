"use client";

import { getScoreGaugeColor } from "@/lib/kwi/formatters";

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
}

/**
 * ScoreGauge — animated SVG ring showing a 0–100 score.
 * Ported from KWI unchanged (import path adapted).
 */
export function ScoreGauge({ score, size = 56, strokeWidth = 5 }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreGaugeColor(score);

  return (
    <svg width={size} height={size} className="transform -rotate-90" aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  );
}
