/**
 * PullToRefreshProvider.tsx — Wraps the scrollable main area with pull-to-refresh.
 *
 * Ported from krishi-ai reference. Attaches touch listeners to the scroll
 * container; pulling past the top triggers onRefresh and shows a rotating
 * refresh icon whose rotation tracks pull distance.
 */

"use client";

import { ReactNode } from "react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";

interface Props {
  children: ReactNode;
  onRefresh?: () => Promise<void> | void;
}

export default function PullToRefreshProvider({
  children,
  onRefresh,
}: Props) {
  const { containerRef, pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh:
      onRefresh ??
      (async () => {
        // Default: reload the page
        if (typeof window !== "undefined") window.location.reload();
      }),
  });

  return (
    <div
      ref={containerRef}
      className="h-dvh overflow-y-auto overscroll-y-contain"
    >
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center transition-transform"
          style={{
            height: pullDistance,
            opacity: Math.min(pullDistance / 80, 1),
          }}
        >
          <div
            className={`w-5 h-5 text-[#2e7d32] ${isRefreshing ? "animate-spin" : ""}`}
            style={{
              transform: `rotate(${pullDistance * 3}deg)`,
              animationDuration: "1s",
            }}
          >
            ↻
          </div>
        </div>
      )}
      {children}
    </div>
  );
}