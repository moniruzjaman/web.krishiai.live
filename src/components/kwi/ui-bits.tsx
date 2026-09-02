"use client";

import type { CSSProperties } from "react";
/**
 * ui-bits.tsx — Tiny presentational primitives for KWI components.
 *
 * KrishiAI does not ship @radix-ui/react-progress / react-separator.
 * These drop-in replacements avoid adding new dependencies to the PR
 * while keeping the ported KWI views visually identical.
 */

import { cn } from "@/lib/utils";

// ── Progress bar ─────────────────────────────────────────────────────────────
export function KProgress({
  value = 0,
  className,
  barClassName,
  style,
}: {
  value?: number;
  className?: string;
  /** classes applied to the inner bar, e.g. "[&>div]:bg-red-500" equivalents */
  barClassName?: string;
  style?: CSSProperties;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/15",
        className,
      )}
      style={style}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-all", barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Separator ────────────────────────────────────────────────────────────────
export function KSeparator({
  className,
  orientation = "horizontal",
}: {
  className?: string;
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <div
      role="separator"
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
    />
  );
}
