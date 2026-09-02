/**
 * risk-colors.ts — Hex colors for KWI risk levels on dark card surfaces.
 * (Tailwind classes from formatters.ts target light/dark text; the home
 * weather card's dark green gradient needs raw hex for dots/borders.)
 * Category labels come from the shared categoryBn() in overview.tsx.
 */

import type { RiskLevel } from "@/lib/kwi/types";

export function getRiskColorHex(level: RiskLevel): string {
  switch (level) {
    case "low": return "#34d399"; // emerald-400
    case "moderate": return "#fbbf24"; // amber-400
    case "high": return "#fb923c"; // orange-400
    case "very_high": return "#f87171"; // red-400
  }
}
