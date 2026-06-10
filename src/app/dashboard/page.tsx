/**
 * DashboardPage — OpenProvider Orchestration Hub Dashboard
 *
 * Real-time monitoring for the KrishiAI orchestration system:
 * - Token usage per AI provider
 * - Database sync status (Supabase)
 * - Deployment history (Vercel)
 * - Provider health & routing map
 * - Task orchestration graph
 */

"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ProviderInfo {
  name: string;
  health: string;
  keyConfigured: boolean;
  model: string;
}

interface DatabaseInfo {
  status: string;
  latencyMs: number;
  provider: string;
}

interface SystemStatus {
  ok: boolean;
  version: string;
  database: DatabaseInfo;
  providers: Record<string, ProviderInfo>;
  orchestration: {
    totalCalls: number;
    totalTokens: number;
    healthyProviders: number;
    degradedProviders: number;
    downProviders: number;
    taskRoutingMap: Record<string, string[]>;
  };
  deployment: {
    platform: string;
    region: string;
    framework: string;
    runtime: string;
  };
}

interface ProviderUsage {
  name: string;
  totalCalls: number;
  totalTokens: number;
  avgLatencyMs: number;
  status: string;
  lastSuccess: string | null;
  lastFailure: string | null;
}

interface UsageData {
  ok: boolean;
  period: string;
  summary: {
    totalCalls: number;
    totalTokens: number;
    healthyProviders: number;
    totalProviders: number;
  };
  providers: ProviderUsage[];
  quotaReference: Record<string, Record<string, number>>;
}

interface DeploymentInfo {
  version: string;
  branch: string;
  commit: string;
  commitMessage: string;
  commitDate: string;
  author: string;
  buildStatus: string;
}

interface DeploymentData {
  ok: boolean;
  platform: string;
  region: string;
  deployments: DeploymentInfo[];
}

// ── Bengali numeral helper ───────────────────────────────────────────────────
const bn = (n: number | string) =>
  String(Math.round(Number(n))).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

// ── Status badge component ───────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: "bg-green-100 text-green-700 border-green-200",
    connected: "bg-green-100 text-green-700 border-green-200",
    degraded: "bg-amber-100 text-amber-700 border-amber-200",
    down: "bg-red-100 text-red-700 border-red-200",
    error: "bg-red-100 text-red-700 border-red-200",
    unreachable: "bg-red-100 text-red-700 border-red-200",
    not_configured: "bg-gray-100 text-gray-500 border-gray-200",
    unknown: "bg-gray-100 text-gray-500 border-gray-200",
    current: "bg-green-100 text-green-700 border-green-200",
    deployed: "bg-gray-100 text-gray-500 border-gray-200",
  };

  const labels: Record<string, string> = {
    healthy: "সুস্থ",
    connected: "সংযুক্ত",
    degraded: "মন্দ",
    down: "অকার্যকর",
    error: "ত্রুটি",
    unreachable: "পৌঁছানো যাচ্ছে না",
    not_configured: "কনফিগার নেই",
    unknown: "অজানা",
    current: "বর্তমান",
    deployed: "স্থাপিত",
  };

  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
        colors[status] || colors.unknown
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

// ── Provider icon helper ─────────────────────────────────────────────────────
function ProviderIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    gemini: "✨",
    openrouter: "🔀",
    groq: "⚡",
  };
  return <span className="text-lg">{icons[name] || "🤖"}</span>;
}

// ── Orchestration Graph (visual) ─────────────────────────────────────────────
function OrchestrationGraph({
  routingMap,
}: {
  routingMap: Record<string, string[]>;
}) {
  const taskGroups = [
    {
      label: "ব্যবহারকারী সেবা",
      tasks: ["chat", "diagnose", "soil_analysis", "crop_database", "news_bulletin"],
    },
    {
      label: "অর্কেস্ট্রেশন",
      tasks: ["schema", "infra", "refactor", "validation", "polish", "automation"],
    },
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🌐</span>
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
          অর্কেস্ট্রেশন গ্রাফ
        </span>
      </div>

      {/* OpenProvider Node */}
      <div className="flex justify-center mb-3">
        <div className="bg-[#1b4332] text-white text-xs font-bold px-4 py-2 rounded-lg">
          OpenProvider (কেন্দ্রীয়)
        </div>
      </div>

      <div className="flex justify-center mb-3">
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
      </div>

      {/* Task Groups */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {taskGroups.map((group) => (
          <div key={group.label}>
            <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2 text-center">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.tasks.map((task) => {
                const providers = routingMap[task] || [];
                return (
                  <div
                    key={task}
                    className="bg-white dark:bg-gray-700 rounded-lg p-2 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {task}
                    </div>
                    <div className="flex gap-1">
                      {providers.map((p, i) => (
                        <span
                          key={p}
                          className="text-[8px] bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full"
                        >
                          {i === 0 ? "1st " : i === 1 ? "2nd " : "3rd "}
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mb-3">
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
      </div>

      {/* Vercel Node */}
      <div className="flex justify-center">
        <div className="bg-black text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 76 65" fill="white">
            <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
          </svg>
          Vercel (স্থাপনা)
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [deployments, setDeployments] = useState<DeploymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, usageRes, deployRes] = await Promise.allSettled([
        fetch("/api/dashboard/status").then((r) => r.json()),
        fetch("/api/dashboard/usage").then((r) => r.json()),
        fetch("/api/dashboard/deployments").then((r) => r.json()),
      ]);

      if (statusRes.status === "fulfilled") setStatus(statusRes.value);
      if (usageRes.status === "fulfilled") setUsage(usageRes.value);
      if (deployRes.status === "fulfilled") setDeployments(deployRes.value);

      if (statusRes.status === "rejected") setError("স্ট্যাটাস লোড ব্যর্থ");
    } catch {
      setError("ড্যাশবোর্ড ডেটা লোড ব্যর্থ");
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Loading state ───────────────────────────────────────────────────────
  if (loading && !status) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#1b4332] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="text-sm text-gray-500 dark:text-gray-400">
            ড্যাশবোর্ড লোড হচ্ছে...
          </div>
        </div>
      </div>
    );
  }

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
        <h1 className="text-[22px] font-bold text-white mb-1">
          🌐 অর্কেস্ট্রেশন হাব
        </h1>
        <p className="text-[11px] text-white/60">
          OpenProvider কেন্দ্রীয় মনিটরিং ড্যাশবোর্ড
        </p>

        {/* Quick stats row */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            {
              value: status?.orchestration?.totalCalls || 0,
              label: "মোট কল",
              icon: "📞",
            },
            {
              value: status?.orchestration?.totalTokens || 0,
              label: "টোকেন",
              icon: "🪙",
            },
            {
              value: status?.orchestration?.healthyProviders || 0,
              label: "সুস্থ",
              icon: "✅",
            },
            {
              value: status?.orchestration?.downProviders || 0,
              label: "অকার্যকর",
              icon: "❌",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center"
            >
              <div className="text-sm">{stat.icon}</div>
              <div className="text-base font-extrabold text-white">
                {bn(stat.value)}
              </div>
              <div className="text-[8px] text-white/50 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-5 pb-24 space-y-4">
        {/* ═══ Error Banner ═════════════════════════════════════════════════ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-[12px] text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* ═══ Refresh Bar ═══════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-gray-400 dark:text-gray-500">
            সর্বশেষ আপডেট:{" "}
            {lastRefresh.toLocaleTimeString("bn-BD")}
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full hover:bg-green-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "লোড হচ্ছে..." : "🔄 রিফ্রেশ"}
          </button>
        </div>

        {/* ═══ Database Status ══════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 card-shadow">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🗄️</span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              ডাটাবেস স্থিতি
            </span>
            <StatusBadge status={status?.database?.status || "unknown"} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
              <div className="text-[9px] text-gray-500 dark:text-gray-400 mb-1">
                প্রদানকারী
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Supabase
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
              <div className="text-[9px] text-gray-500 dark:text-gray-400 mb-1">
                লেটেন্সি
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {bn(status?.database?.latencyMs || 0)}ms
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
              <div className="text-[9px] text-gray-500 dark:text-gray-400 mb-1">
                সংস্করণ
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {status?.version || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ AI Provider Health ═══════════════════════════════════════════ */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 card-shadow">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🤖</span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              AI প্রদানকারী স্বাস্থ্য
            </span>
          </div>
          <div className="space-y-2">
            {status?.providers &&
              Object.entries(status.providers).map(([name, info]) => (
                <div
                  key={name}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                >
                  <ProviderIcon name={name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100 capitalize">
                        {name}
                      </span>
                      <StatusBadge status={info.health} />
                      {!info.keyConfigured && (
                        <span className="text-[8px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">
                          কী নেই
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                      {info.model}
                    </div>
                  </div>
                  {/* Usage stats from /usage endpoint */}
                  {usage?.providers && (
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-gray-700 dark:text-gray-300">
                        {bn(
                          usage.providers.find((p) => p.name === name)
                            ?.totalCalls || 0
                        )}{" "}
                        কল
                      </div>
                      <div className="text-[9px] text-gray-400 dark:text-gray-500">
                        {bn(
                          usage.providers.find((p) => p.name === name)
                            ?.totalTokens || 0
                        )}{" "}
                        টোকেন
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* ═══ Token Usage (Provider Breakdown) ═════════════════════════════ */}
        {usage && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 card-shadow">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">📊</span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                টোকেন ব্যবহার
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">
                মোট: {bn(usage.summary.totalTokens)} টোকেন
              </span>
            </div>

            {/* Visual bar chart */}
            <div className="space-y-3">
              {usage.providers.map((provider) => {
                const maxTokens = Math.max(
                  ...usage.providers.map((p) => p.totalTokens || 1)
                );
                const barWidth =
                  maxTokens > 0
                    ? ((provider.totalTokens || 0) / maxTokens) * 100
                    : 0;
                return (
                  <div key={provider.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {provider.name}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {bn(provider.totalTokens)} টোকেন •{" "}
                        {bn(provider.avgLatencyMs)}ms গড়
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#1b4332] to-[#1b8a3e] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(barWidth, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quota reference */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2">
                কোটা সীমা (ফ্রি টায়ার)
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {Object.entries(usage.quotaReference?.free || {}).map(
                  ([feature, limit]) => (
                    <div
                      key={feature}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-1.5 text-center"
                    >
                      <div className="text-[9px] text-gray-500 dark:text-gray-400 truncate">
                        {feature === "chat"
                          ? "চ্যাট"
                          : feature === "diagnose"
                          ? "নির্ণয়"
                          : feature === "soil_analysis"
                          ? "মাটি"
                          : feature === "crop_database"
                          ? "ফসল"
                          : "সংবাদ"}
                      </div>
                      <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        {bn(limit)}/দিন
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ Orchestration Graph ══════════════════════════════════════════ */}
        {status?.orchestration?.taskRoutingMap && (
          <OrchestrationGraph
            routingMap={status.orchestration.taskRoutingMap}
          />
        )}

        {/* ═══ Deployment History ═══════════════════════════════════════════ */}
        {deployments && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 card-shadow">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🚀</span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                স্থাপনা ইতিহাস
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">
                {deployments.platform} • {deployments.region}
              </span>
            </div>
            <div className="space-y-2">
              {deployments.deployments.slice(0, 5).map((dep, i) => (
                <div
                  key={dep.commit + i}
                  className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        dep.buildStatus === "current"
                          ? "bg-green-500 animate-pulse-dot"
                          : "bg-gray-300 dark:bg-gray-500"
                      }`}
                    />
                    {i < Math.min(deployments.deployments.length, 5) - 1 && (
                      <div className="w-px h-4 bg-gray-200 dark:bg-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-gray-700 dark:text-gray-300">
                        {dep.commit}
                      </span>
                      <StatusBadge status={dep.buildStatus} />
                      <span className="text-[8px] bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                        {dep.branch}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-600 dark:text-gray-400 truncate mt-0.5">
                      {dep.commitMessage}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[9px] text-gray-400 dark:text-gray-500">
                      {new Date(dep.commitDate).toLocaleDateString("bn-BD", {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                    <div className="text-[9px] text-gray-400 dark:text-gray-500">
                      {dep.author}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ System Info ══════════════════════════════════════════════════ */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">ℹ️</span>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
              সিস্টেম তথ্য
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                label: "প্ল্যাটফর্ম",
                value: status?.deployment?.platform || "Vercel",
              },
              {
                label: "অঞ্চল",
                value: status?.deployment?.region || "hkg1",
              },
              {
                label: "ফ্রেমওয়ার্ক",
                value: status?.deployment?.framework || "Next.js 16",
              },
              {
                label: "রানটাইম",
                value: status?.deployment?.runtime || "Bun",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 px-2 bg-white dark:bg-gray-700 rounded-lg"
              >
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  {item.label}
                </span>
                <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
