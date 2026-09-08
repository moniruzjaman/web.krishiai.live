/**
 * ProfilePage.tsx — Enhanced Profile with localStorage-based Activity Tracking
 *
 * Features:
 * - Editable user name (inline edit mode, stored in localStorage)
 * - Activity tracking with timeline (stored in localStorage)
 * - Dynamic stats from localStorage keys
 * - Functional menu items with navigation and toggles
 * - Settings section with toggle switches
 * - Activity timeline (collapsible)
 * - App info with localStorage usage and clear data
 */

"use client";

import {
  useState,
  useCallback,
  useRef,
  useSyncExternalStore,
  useMemo,
} from "react";
import { subscribeToPush } from "@/lib/pushClient";

// ── Types ────────────────────────────────────────────────────────────────────
interface ActivityEvent {
  type: "chat" | "analyze" | "tool";
  label: string;
  timestamp: number;
}

// ── Constants ────────────────────────────────────────────────────────────────
const USER_NAME_KEY = "krishi_user_name";
const ACTIVITY_LOG_KEY = "krishi_activity_log";
const HOME_CHAT_KEY = "krishi_home_chat";
const CHAT_MESSAGES_KEY = "krishi_chat_messages";
const NOTIFICATIONS_KEY = "krishi_notifications";
const AUTOREFRESH_KEY = "krishi_autorefresh";
const DEFAULT_NAME = "কৃষক ভাই";

// ── Bengali numeral helper ───────────────────────────────────────────────────
const bn = (n: number | string) =>
  String(Math.round(Number(n))).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

// ── localStorage external store hooks ────────────────────────────────────────
// We use useSyncExternalStore to read localStorage without calling setState
// in effects, avoiding the React 19 cascading-render lint rule.

/** Global set of listeners keyed by storage key */
const storageListeners = new Map<string, Set<() => void>>();

function notifyListeners(key: string) {
  storageListeners.get(key)?.forEach((fn) => fn());
}

function subscribeToKey(key: string, callback: () => void): () => void {
  if (!storageListeners.has(key)) {
    storageListeners.set(key, new Set());
  }
  storageListeners.get(key)!.add(callback);

  // Also listen for cross-tab storage events
  const handler = (e: StorageEvent) => {
    if (e.key === key || e.key === null) callback();
  };
  window.addEventListener("storage", handler);

  return () => {
    storageListeners.get(key)?.delete(callback);
    window.removeEventListener("storage", handler);
  };
}

/**
 * Custom hook to read a value from localStorage using useSyncExternalStore.
 * This avoids calling setState in effects.
 */
function useLocalStorageString(
  key: string,
  fallback: string
): [string, (val: string) => void] {
  const subscribe = useCallback(
    (cb: () => void) => subscribeToKey(key, cb),
    [key]
  );

  const getSnapshot = useCallback(() => {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }, [key, fallback]);

  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (val: string) => {
      try {
        localStorage.setItem(key, val);
        notifyListeners(key);
      } catch {
        // Storage full
      }
    },
    [key]
  );

  return [raw, setValue];
}

/**
 * Custom hook to read a JSON value from localStorage.
 */
function useLocalStorageJson<T>(
  key: string,
  fallback: T
): [T, (val: T) => void] {
  const subscribe = useCallback(
    (cb: () => void) => subscribeToKey(key, cb),
    [key]
  );

  const getSnapshot = useCallback(() => {
    try {
      return localStorage.getItem(key) ?? JSON.stringify(fallback);
    } catch {
      return JSON.stringify(fallback);
    }
  }, [key, fallback]);

  const getServerSnapshot = useCallback(
    () => JSON.stringify(fallback),
    [fallback]
  );

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const parsed = useMemo<T>(() => {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }, [raw, fallback]);

  const setValue = useCallback(
    (val: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(val));
        notifyListeners(key);
      } catch {
        // Storage full
      }
    },
    [key]
  );

  return [parsed, setValue];
}

// ── Storage helpers (non-hook) ───────────────────────────────────────────────
function setStorageItem(key: string, value: string): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, value);
    notifyListeners(key);
  } catch {
    // Storage full
  }
}

function getLocalStorageSize(): string {
  try {
    if (typeof window === "undefined") return "০ KB";
    let total = 0;
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("krishi_")) {
        total += (localStorage.getItem(key) || "").length * 2; // UTF-16
      }
    }
    if (total < 1024) return `${bn(total)} B`;
    return `${bn((total / 1024).toFixed(1))} KB`;
  } catch {
    return "০ KB";
  }
}

// ── Time ago helper ──────────────────────────────────────────────────────────
function timeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "এইমাত্র";
  if (minutes < 60) return `${bn(minutes)} মি আগে`;
  if (hours < 24) return `${bn(hours)} ঘণ্টা আগে`;
  if (days === 1) return "গতকাল";
  if (days < 7) return `${bn(days)} দিন আগে`;
  return new Date(timestamp).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "short",
  });
}

// ── Activity icon helper ─────────────────────────────────────────────────────
function activityIcon(type: ActivityEvent["type"]): string {
  switch (type) {
    case "chat":
      return "🤖";
    case "analyze":
      return "🔬";
    case "tool":
      return "🌾";
    default:
      return "📌";
  }
}

// ── Parse chat count from localStorage strings ───────────────────────────────
function parseArrayLength(raw: string): number {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.length;
    return 0;
  } catch {
    return 0;
  }
}

// ── Chevron icon ──────────────────────────────────────────────────────────
function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9ca3af"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ── Toggle switch component ──────────────────────────────────────────────
function ToggleSwitch({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400/30 ${
        enabled ? "bg-[#1b8a3e]" : "bg-gray-300"
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ── Menu items config ────────────────────────────────────────────────────────
const MENU_ITEMS = [
  {
    icon: "📝",
    label: "আমার প্রোফাইল",
    desc: "ব্যক্তিগত তথ্য সম্পাদনা",
    action: "profile" as const,
  },
  {
    icon: "📊",
    label: "কার্যকলাপ",
    desc: "ব্যবহারের ইতিহাস ও পরিসংখ্যান",
    action: "activity" as const,
  },
  {
    icon: "💾",
    label: "সংরক্ষিত",
    desc: "সংরক্ষিত টিপস ও নিবন্ধ",
    action: "saved" as const,
  },
  {
    icon: "🔔",
    label: "বিজ্ঞপ্তি",
    desc: "পরামর্শ ও আপডেট",
    action: "notifications" as const,
  },
  {
    icon: "📞",
    label: "সাহায্য",
    desc: "সাপোর্ট ও FAQ",
    action: "help" as const,
  },
  {
    icon: "⚙️",
    label: "সেটিংস",
    desc: "অ্যাপ সেটিংস ও পছন্দ",
    action: "settings" as const,
  },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  // ── localStorage-backed state via useSyncExternalStore ───────────────────
  const [userNameRaw, setUserNameRaw] = useLocalStorageString(
    USER_NAME_KEY,
    DEFAULT_NAME
  );
  const userName = userNameRaw || DEFAULT_NAME;

  const [activityLog, setActivityLog] = useLocalStorageJson<ActivityEvent[]>(
    ACTIVITY_LOG_KEY,
    []
  );

  const [homeChatRaw] = useLocalStorageString(HOME_CHAT_KEY, "[]");
  const [chatMessagesRaw] = useLocalStorageString(CHAT_MESSAGES_KEY, "[]");

  const [notificationsRaw, setNotificationsRaw] = useLocalStorageString(
    NOTIFICATIONS_KEY,
    "true"
  );
  const notifications = notificationsRaw !== "false";

  const [autoRefreshRaw, setAutoRefreshRaw] = useLocalStorageString(
    AUTOREFRESH_KEY,
    "false"
  );
  const autoRefresh = autoRefreshRaw === "true";

  // ── Computed stats ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const chatCount =
      parseArrayLength(homeChatRaw) + parseArrayLength(chatMessagesRaw);
    const analyzeCount = activityLog.filter(
      (e: ActivityEvent) => e.type === "analyze"
    ).length;
    const savedCount = activityLog.filter(
      (e: ActivityEvent) => e.type === "tool"
    ).length;
    return { chat: chatCount, analyze: analyzeCount, saved: savedCount };
  }, [homeChatRaw, chatMessagesRaw, activityLog]);

  const storageSize = useMemo(() => getLocalStorageSize(), [
    activityLog,
    userNameRaw,
    notificationsRaw,
    autoRefreshRaw,
    homeChatRaw,
    chatMessagesRaw,
  ]);

  // ── Local UI state ───────────────────────────────────────────────────────
  const [isEditingName, setIsEditingName] = useState(false);
  const [editInput, setEditInput] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);

  const [showActivity, setShowActivity] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // ── Save name to localStorage ────────────────────────────────────────────
  const saveName = useCallback(() => {
    const trimmed = editInput.trim();
    if (trimmed) {
      setUserNameRaw(trimmed);
      // Log activity
      setActivityLog([
        ...activityLog,
        {
          type: "tool" as const,
          label: "প্রোফাইল আপডেট",
          timestamp: Date.now(),
        },
      ]);
    }
    setIsEditingName(false);
  }, [editInput, setUserNameRaw, setActivityLog, activityLog]);

  const cancelEditName = useCallback(() => {
    setIsEditingName(false);
    setEditInput("");
  }, []);

  const startEditName = useCallback(() => {
    setEditInput(userName);
    setIsEditingName(true);
  }, [userName]);

  // ── Toggle handlers ──────────────────────────────────────────────────────
  const toggleNotifications = useCallback(() => {
    setNotificationsRaw(String(!notifications));
  }, [notifications, setNotificationsRaw]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshRaw(String(!autoRefresh));
  }, [autoRefresh, setAutoRefreshRaw]);

  // ── Menu item actions ────────────────────────────────────────────────────
  const handleMenuAction = useCallback(
    (action: string) => {
      switch (action) {
        case "profile":
          profileRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          setTimeout(() => startEditName(), 400);
          break;
        case "activity":
          setShowActivity((prev) => !prev);
          break;
        case "saved":
          window.location.href = "/tools/crop-library";
          break;
        case "notifications":
          setShowNotifications((prev) => !prev);
          break;
        case "help":
          window.location.href = "/chat";
          break;
        case "settings":
          setShowSettings((prev) => !prev);
          break;
      }
    },
    [startEditName]
  );

  // ── Clear all data ───────────────────────────────────────────────────────
  const clearAllData = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      const keysToRemove = Object.keys(localStorage).filter((k) =>
        k.startsWith("krishi_")
      );
      keysToRemove.forEach((k) => {
        localStorage.removeItem(k);
        notifyListeners(k);
      });
      // Reset local UI state
      setShowClearConfirm(false);
    } catch {
      // ignore
    }
  }, []);

  // ── Derived values ───────────────────────────────────────────────────────
  const avatarLetter = userName.charAt(0) || "ক";
  const recentActivity = [...activityLog].reverse().slice(0, 10);

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* ═══ Header ═══════════════════════════════════════════════════════════ */}
      <div
        className="relative px-4 pt-5 pb-10"
        style={{
          background: "linear-gradient(135deg,#1b4332,#2d6a4f)",
        }}
      >
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">
          KRISHI AI
        </div>
        <h1 className="text-[22px] font-bold text-white mb-4">
          👤 প্রোফাইল
        </h1>

        {/* User info card */}
        <div
          ref={profileRef}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-[#1b8a3e] flex items-center justify-center text-2xl font-bold text-white shrink-0">
            {avatarLetter}
          </div>
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") cancelEditName();
                  }}
                  placeholder="আপনার নাম লিখুন"
                  className="bg-white/20 text-white placeholder:text-white/40 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-white/30 border border-white/20"
                  autoFocus
                  maxLength={30}
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveName}
                    className="text-[10px] font-bold bg-white/20 text-white rounded-full px-3 py-1 hover:bg-white/30 transition-colors"
                  >
                    ✓ সংরক্ষণ
                  </button>
                  <button
                    onClick={cancelEditName}
                    className="text-[10px] font-bold bg-white/10 text-white/70 rounded-full px-3 py-1 hover:bg-white/20 transition-colors"
                  >
                    ✕ বাতিল
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="cursor-pointer group"
                onClick={startEditName}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") startEditName();
                }}
              >
                <div className="text-base font-bold text-white flex items-center gap-1.5">
                  {userName}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="text-white/40 group-hover:text-white/70 transition-colors"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <div className="text-[11px] text-white/70">
                  কৃষি AI ব্যবহারকারী
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  <span className="text-[10px] text-white/60">সক্রিয়</span>
                  <span className="text-[10px] text-white/40 ml-2">
                    নাম পরিবর্তন করতে ক্লিক করুন
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 pb-24">
        {/* ═══ Dynamic Stats ═════════════════════════════════════════════════ */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {
              value: stats.chat > 0 ? bn(stats.chat) : "০",
              label: "পরামর্শ",
              icon: "💬",
            },
            {
              value: stats.analyze > 0 ? bn(stats.analyze) : "০",
              label: "বিশ্লেষণ",
              icon: "🔬",
            },
            {
              value: stats.saved > 0 ? bn(stats.saved) : "০",
              label: "সংরক্ষিত",
              icon: "💾",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700"
            >
              <div className="text-lg mb-0.5">{stat.icon}</div>
              <div className="text-lg font-extrabold text-[#1b4332]">
                {stat.value}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* ═══ Menu Items ════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-2">
          {MENU_ITEMS.map((item, i) => (
            <div
              key={i}
              onClick={() => handleMenuAction(item.action)}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white hover:bg-green-50/30 transition-colors cursor-pointer card-shadow"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleMenuAction(item.action);
              }}
            >
              <div className="text-2xl">{item.icon}</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {item.label}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 dark:text-gray-500">{item.desc}</div>
              </div>
              {/* Show toggle indicator for activity / settings when active */}
              {item.action === "activity" && showActivity && (
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  খোলা
                </span>
              )}
              {item.action === "settings" && showSettings && (
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  খোলা
                </span>
              )}
              <ChevronRight />
            </div>
          ))}
        </div>

        {/* ═══ Notifications Toggle Section ═════════════════════════════════ */}
        {showNotifications && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔔</span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                বিজ্ঞপ্তি সেটিংস
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  বিজ্ঞপ্তি সক্রিয়
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  কৃষি পরামর্শ ও আপডেট পান
                </div>
              </div>
              <ToggleSwitch
                enabled={notifications}
                onToggle={toggleNotifications}
              />
            </div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
              {notifications
                ? "✓ আপনি বিজ্ঞপ্তি পাবেন"
                : "✕ বিজ্ঞপ্তি বন্ধ আছে"}
            </div>
          </div>
        )}

        {/* ═══ Activity Timeline ════════════════════════════════════════════ */}
        {showActivity && (
          <div className="mt-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  সাম্প্রতিক কার্যকলাপ
                </span>
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                সর্বশেষ {bn(recentActivity.length)} টি
              </span>
            </div>

            {recentActivity.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">📋</div>
                <div className="text-[12px] text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  এখনো কোনো কার্যকলাপ নেই
                </div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                  অ্যাপ ব্যবহার শুরু করলে এখানে দেখাবে
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {recentActivity.map((event, i) => (
                  <div key={event.timestamp + i} className="flex gap-3">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-white border border-gray-200 dark:border-gray-700 flex items-center justify-center text-sm shrink-0">
                        {activityIcon(event.type)}
                      </div>
                      {i < recentActivity.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 my-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div
                      className={`flex-1 ${
                        i < recentActivity.length - 1 ? "pb-4" : "pb-1"
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {event.label}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {timeAgo(event.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Activity summary */}
            {activityLog.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-sm font-bold text-[#1b4332]">
                      {bn(
                        activityLog.filter(
                          (e: ActivityEvent) => e.type === "chat"
                        ).length
                      )}
                    </div>
                    <div className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">চ্যাট</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#1b4332]">
                      {bn(
                        activityLog.filter(
                          (e: ActivityEvent) => e.type === "analyze"
                        ).length
                      )}
                    </div>
                    <div className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">বিশ্লেষণ</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#1b4332]">
                      {bn(
                        activityLog.filter(
                          (e: ActivityEvent) => e.type === "tool"
                        ).length
                      )}
                    </div>
                    <div className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">টুল</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ Settings Section ═════════════════════════════════════════════ */}
        {showSettings && (
          <div className="mt-4 bg-white border border-gray-200 dark:border-gray-700 rounded-2xl p-4 card-shadow">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">⚙️</span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">সেটিংস</span>
            </div>

            <div className="space-y-4">
              {/* Location Permission */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <span className="text-base">📍</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      অবস্থান অনুমতি
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      আবহাওয়া ও স্থানীয় তথ্যের জন্য
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(() => {}, () => {});
                    }
                  }}
                  className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full hover:bg-green-100 transition-colors cursor-pointer"
                >
                  অনুমোদিত ✓
                </button>
              </div>

              {/* Notification Permission */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                    <span className="text-base">🔔</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      বিজ্ঞপ্তি অনুমতি
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      আবহাওয়া সতর্কতা ও কৃষি পরামর্শ
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (typeof Notification === "undefined") return;
                    const currentPermission: NotificationPermission = Notification.permission;
                    if (currentPermission === "default") {
                      const subscribed = await subscribeToPush();
                      const permissionNow: NotificationPermission = Notification.permission;
                      if (subscribed) {
                        new Notification("কৃষি AI 🌾", {
                          body: "বিজ্ঞপ্তি সক্রিয় হয়েছে! আপনি আবহাওয়া সতর্কতা ও কৃষি পরামর্শ পাবেন।",
                          icon: "/icons/icon-192.png",
                        });
                      } else if (permissionNow === "denied") {
                        alert("ব্রাউজার সেটিংস থেকে বিজ্ঞপ্তি অনুমতি দিন।");
                      }
                    } else if (currentPermission === "denied") {
                      alert("ব্রাউজার সেটিংস থেকে বিজ্ঞপ্তি অনুমতি দিন।");
                    }
                  }}
                  className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  {typeof Notification !== "undefined" && Notification.permission === "granted"
                    ? "অনুমোদিত ✓"
                    : typeof Notification !== "undefined" && Notification.permission === "denied"
                    ? "অস্বীকৃত ✕"
                    : "অনুমতি দিন"}
                </button>
              </div>

              {/* Notifications Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                    <span className="text-base">🔔</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      বিজ্ঞপ্তি
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      পরামর্শ ও আপডেট পান
                    </div>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={notifications}
                  onToggle={toggleNotifications}
                />
              </div>

              {/* Auto-refresh Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                    <span className="text-base">🔄</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      অটো-রিফ্রেশ
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      ডেটা স্বয়ংক্রিয়ভাবে আপডেট
                    </div>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={autoRefresh}
                  onToggle={toggleAutoRefresh}
                />
              </div>

              {/* Language */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                    <span className="text-base">🌐</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      ভাষা
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      ইন্টারফেস ভাষা নির্বাচন
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  বাংলা
                </span>
              </div>

              {/* Install App */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                    <span className="text-base">📲</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      অ্যাপ ইনস্টল
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      হোম স্ক্রিনে যোগ করুন — দ্রুত অ্যাক্সেস
                    </div>
                  </div>
                </div>
                <button
                  id="krishi-install-btn"
                  className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full hover:bg-green-100 transition-colors cursor-pointer"
                >
                  ইনস্টল করুন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Logout ═══════════════════════════════════════════════════════ */}
        <button className="mt-6 w-full py-3 rounded-xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors">
          লগআউট
        </button>

        {/* ═══ App Info Section ═════════════════════════════════════════════ */}
        <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">ℹ️</span>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">অ্যাপ তথ্য</span>
          </div>

          <div className="space-y-2">
            {/* Version */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[12px] text-gray-600 dark:text-gray-400">সংস্করণ</span>
              <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-200">
                v3.1.1 @2026
              </span>
            </div>

            {/* Data stored */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[12px] text-gray-600 dark:text-gray-400">সংরক্ষিত ডেটা</span>
              <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-200">
                {storageSize}
              </span>
            </div>

            {/* Data status */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[12px] text-gray-600 dark:text-gray-400">ডেটা স্থিতি</span>
              <span className="text-[12px] font-semibold text-green-600">
                ✓ স্থানীয় সংরক্ষিত
              </span>
            </div>

            {/* Support Email */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[12px] text-gray-600 dark:text-gray-400">সাপোর্ট</span>
              <a
                href="mailto:support@krishiai.live"
                className="text-[12px] font-semibold text-green-700 dark:text-green-400 hover:underline"
              >
                support@krishiai.live
              </a>
            </div>
          </div>

          {/* Clear data button */}
          {showClearConfirm ? (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
              <div className="text-[12px] text-red-700 font-medium mb-2">
                ⚠️ সমস্ত ডেটা মুছে ফেলবেন? এটি পূর্বাবস্থায় ফেরানো যাবে না।
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearAllData}
                  className="text-[11px] font-bold bg-red-500 text-white rounded-full px-4 py-1.5 hover:bg-red-600 transition-colors"
                >
                  হ্যাঁ, মুছুন
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="text-[11px] font-bold bg-white border border-red-200 text-red-600 rounded-full px-4 py-1.5 hover:bg-red-50 transition-colors"
                >
                  বাতিল
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="mt-3 w-full text-[11px] font-bold text-red-500 border border-red-200 rounded-xl py-2 hover:bg-red-50 transition-colors"
            >
              🗑️ সমস্ত ডেটা মুছুন
            </button>
          )}
        </div>

        {/* ═══ Version Footer ══════════════════════════════════════════════ */}
        <div className="text-center mt-4 text-[10px] text-gray-400 dark:text-gray-500">
          কৃষি AI v3.0.0 · © ২০২৫
        </div>
      </div>
    </div>
  );
}
