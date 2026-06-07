/**
 * LoadingSkeleton — Skeleton loader for tool pages
 *
 * Displays a pulsing placeholder matching the typical
 * tool page layout while content loads.
 */

"use client";

interface LoadingSkeletonProps {
  variant?: "default" | "map" | "chart";
}

export default function LoadingSkeleton({ variant = "default" }: LoadingSkeletonProps) {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      {/* Header skeleton */}
      <div className="px-4 pt-5 pb-7" style={{ background: "linear-gradient(135deg,#1b4332,#2d6a4f)" }}>
        <div className="h-3 bg-white/20 rounded w-20 mb-3" />
        <div className="h-6 bg-white/20 rounded w-48 mb-2" />
        <div className="h-3 bg-white/15 rounded w-64" />
      </div>

      <div className="px-4 pt-5 pb-24 space-y-4">
        {/* Info cards skeleton */}
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 rounded-2xl p-3.5 border border-gray-200">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full" />
                <div className="h-2 bg-gray-200 rounded w-16" />
              </div>
              <div className="h-6 bg-gray-200 rounded w-12 mb-1" />
              <div className="h-1.5 bg-gray-200 rounded w-20" />
            </div>
          ))}
        </div>

        {/* Main content skeleton */}
        {variant === "map" ? (
          <div className="bg-gray-100 rounded-2xl border border-gray-200 h-[360px]" />
        ) : variant === "chart" ? (
          <div className="bg-gray-100 rounded-2xl border border-gray-200 p-4">
            <div className="h-3 bg-gray-200 rounded w-32 mb-4" />
            <div className="flex items-end gap-2 h-[160px]">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex-1 bg-gray-200 rounded-t" style={{ height: `${30 + Math.random() * 70}%` }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-gray-100 rounded-2xl border border-gray-200 p-4">
              <div className="h-3 bg-gray-200 rounded w-40 mb-3" />
              <div className="space-y-2">
                <div className="h-2 bg-gray-200 rounded w-full" />
                <div className="h-2 bg-gray-200 rounded w-3/4" />
                <div className="h-2 bg-gray-200 rounded w-5/6" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
