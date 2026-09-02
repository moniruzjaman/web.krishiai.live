"use client";

/**
 * live-status.tsx — Realtime location + datetime badge for KWI surfaces.
 *
 * Shows:
 * - Live Bangla date & time (Asia/Dhaka, auto-updating via useNow)
 * - Authentic-location feedback: green "লাইভ GPS" dot + ±accuracy when a real
 *   GPS fix drives the advisory, or an amber "ঢাকা ফলব্যাক" chip with a
 *   one-tap enable button when it doesn't.
 *
 * Used by the home weather card, KWI insights widget and /weather-intelligence
 * so every advisory surface states *where* and *when* it applies.
 */

import { useLanguage } from "@/context/LanguageContext";
import { useLocation } from "@/context/LocationContext";
import { useKwiLocationStatus, useNow } from "@/hooks/use-kwi";
import { formatBanglaDate, formatBanglaTime, toBnDigits } from "@/lib/kwi/formatters";
import { cn } from "@/lib/utils";

interface Props {
  /** Tailwind size of the datetime text. */
  size?: "xs" | "sm";
  /** Render on dark (gradient) surfaces. */
  dark?: boolean;
  /** Hide the location part (datetime only). */
  datetimeOnly?: boolean;
  className?: string;
}

export function KwiLiveStatus({ size = "xs", dark = false, datetimeOnly = false, className }: Props) {
  const { lang } = useLanguage();
  const { requestLocation } = useLocation();
  const status = useKwiLocationStatus();
  const now = useNow(30_000);

  const tone = dark
    ? status.isLive
      ? "text-white/70"
      : "text-amber-200/90"
    : status.isLive
      ? "text-muted-foreground"
      : "text-amber-600 dark:text-amber-400";
  const text = size === "xs" ? "text-[10px]" : "text-[11px]";

  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-0.5", text, tone, className)}>
      {/* Live datetime (Asia/Dhaka) — fills in after mount (hydration-safe) */}
      {now && (
        <span className="flex items-center gap-1">
          🗓️ {formatBanglaDate(now, lang)}
          <span aria-hidden>·</span>
          🕘 {formatBanglaTime(now, lang)}
        </span>
      )}

      {datetimeOnly ? null : (
        <>
          <span aria-hidden className="opacity-40">|</span>

          {/* Authentic location feedback */}
          {status.isLive ? (
            <span
              className="flex items-center gap-1"
              title={lang === "bn" ? "লাইভ GPS অবস্থান ভিত্তিক পরামর্শ" : "Live GPS-based advisory"}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", dark ? "bg-green-300" : "bg-green-500")} />
              </span>
              {lang === "bn" ? "লাইভ GPS" : "Live GPS"}
              {status.accuracy > 0 && (
                <span className="opacity-80">
                  ±{lang === "bn" ? toBnDigits(Math.round(status.accuracy)) : Math.round(status.accuracy)}m
                </span>
              )}
            </span>
          ) : (
            <button
              onClick={requestLocation}
              className={cn(
                "flex items-center gap-1 rounded-full px-1.5 py-px font-semibold cursor-pointer border transition-colors",
                dark
                  ? "border-amber-300/40 bg-amber-400/10 hover:bg-amber-400/20 text-amber-200"
                  : "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300",
              )}
              title={lang === "bn" ? "আপনার সঠিক অবস্থান ব্যবহার করুন" : "Use your exact location"}
            >
              📍 {lang === "bn" ? "ঢাকা ফলব্যাক — লোকেশন চালু করুন" : "Dhaka fallback — enable location"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
