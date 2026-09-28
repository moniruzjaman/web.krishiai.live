/**
 * use-pull-to-refresh.ts — Android-style pull-to-refresh hook
 *
 * Ported from krishi-ai reference (`use-pull-to-refresh`).
 * Attach the returned `containerRef` to a scroll container; users can pull
 * down past the top to trigger `onRefresh`. Shows a rotating refresh icon
 * whose rotation tracks pull distance.
 *
 * Usage:
 *   const { containerRef, pullDistance, isRefreshing } = usePullToRefresh({
 *     onRefresh: handleRefresh,
 *   });
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number; // px pull required to trigger
  maxPull?: number; // visual cap
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startedAt = useRef<number | null>(null);

  // Track whether the user is at the top of the scroll container.
  const isAtTop = useRef(true);

  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const updateIsAtTop = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    isAtTop.current = el.scrollTop <= 0;
  }, []);

  // Touch start — record Y + whether we're at the top.
  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      startedAt.current = touch.clientY;
    },
    []
  );

  // Touch move — if at top and pulling down, prevent default scroll + track distance.
  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!startedAt.current || isRefreshing) return;
      const touch = e.touches[0];
      if (!touch) return;

      // Re-evaluate top position on each move in case content changed.
      updateIsAtTop();
      if (!isAtTop.current) return;

      const dy = touch.clientY - startedAt.current;
      if (dy > 0) {
        // Clamp to maxPull and apply a slight resistance curve.
        const dist = Math.min(dy * 0.5, maxPull);
        setPullDistance(dist);
        // Prevent the page from scrolling while pulling.
        e.preventDefault();
      }
    },
    [startedAt, isRefreshing, maxPull, updateIsAtTop]
  );

  // Touch end — trigger refresh if threshold reached.
  const onTouchEnd = useCallback(async () => {
    if (!startedAt.current) return;
    startedAt.current = null;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold); // hold at trigger height
      try {
        await onRefreshRef.current();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // passive: false so we can call preventDefault in touchmove
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });
    el.addEventListener("scroll", updateIsAtTop, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("scroll", updateIsAtTop);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd, updateIsAtTop]);

  return { containerRef, pullDistance, isRefreshing };
}