/**
 * AnalyzerPage.tsx — Real AI-Powered Crop Disease Analyzer
 *
 * Features:
 * - Real AI image analysis via /api/analyze (VLM)
 * - Camera capture with environment facing
 * - Gallery upload
 * - File size validation (max 10MB)
 * - Bengali-first diagnosis with treatment & prevention
 * - Error handling with retry
 * - Clear results button
 */

"use client";

import { useState, useRef, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
interface AnalysisResult {
  disease_bn: string;
  disease_en: string;
  confidence: number;
  severity: string;
  description: string;
  treatment: string[];
  prevention: string[];
  affected_crops: string[];
  urgency: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const bn = (n: number | string) =>
  String(Math.round(Number(n))).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

const severityConfig: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  "কম": { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: "✅" },
  "মাঝারি": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "⚠️" },
  "বেশি": { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "🚨" },
  "অজানা": { bg: "bg-gray-50 dark:bg-gray-800", border: "border-gray-200 dark:border-gray-700", text: "text-gray-700 dark:text-gray-300", icon: "❓" },
  "কোনো": { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: "✅" },
};

const urgencyConfig: Record<string, { bg: string; text: string }> = {
  "সাধারণ": { bg: "bg-green-100 text-green-800", text: "সাধারণ" },
  "জরুরি": { bg: "bg-amber-100 text-amber-800", text: "জরুরি" },
  "অতি জরুরি": { bg: "bg-red-100 text-red-800", text: "অতি জরুরি" },
};

export default function AnalyzerPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const analyzeImage = useCallback(async (imageData: string) => {
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      const data = await res.json();

      if (data.ok && data.analysis) {
        setResult(data.analysis);
      } else {
        setError(data.error || "বিশ্লেষণ ব্যর্থ হয়েছে");
      }
    } catch {
      setError("নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।");
    }

    setAnalyzing(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size validation (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("ছবি অত্যন্ত বড়। সর্বোচ্চ ১০ মেগাবাইটের ছবি আপলোড করুন।");
      return;
    }

    // File type validation
    if (!file.type.startsWith("image/")) {
      setError("শুধুমাত্র ছবি ফাইল আপলোড করুন।");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageData = ev.target?.result as string;
      setSelectedImage(imageData);
      analyzeImage(imageData);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleRetry = () => {
    setError(null);
    if (selectedImage) {
      analyzeImage(selectedImage);
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
  };

  const sev = result ? (severityConfig[result.severity] || severityConfig["অজানা"]) : null;
  const urg = result ? (urgencyConfig[result.urgency] || urgencyConfig["সাধারণ"]) : null;

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div
        className="relative px-4 pt-5 pb-7"
        style={{
          background: "linear-gradient(135deg,#1b4332,#2d6a4f)",
        }}
      >
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">
          KRISHI AI
        </div>
        <h1 className="text-[22px] font-bold text-white mb-1">
          ফসল এনালাইজার
        </h1>
        <p className="text-xs text-white/70">
          ছবি তুলে আপনার ফসলের রোগ শনাক্ত করুন ও চিকিৎসা পরামর্শ নিন
        </p>
      </div>

      <div className="px-4 pt-5 pb-24">
        {/* Camera / Upload area */}
        <div
          className="relative rounded-2xl overflow-hidden mb-5"
          style={{
            background: selectedImage ? "transparent" : "linear-gradient(135deg,#f0fdf4,#ecfdf5)",
            border: selectedImage ? "2px solid #1b8a3e" : "2px dashed #1b8a3e",
          }}
        >
          {selectedImage ? (
            <div className="relative">
              <img
                src={selectedImage}
                alt="Selected crop"
                className="w-full h-64 object-cover"
              />
              {analyzing && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin mb-3" />
                  <span className="text-white font-bold text-sm">
                    AI বিশ্লেষণ চলছে...
                  </span>
                  <span className="text-white/70 text-[11px] mt-1">
                    কয়েক সেকেন্ড সময় লাগতে পারে
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="w-20 h-20 rounded-full bg-[#1b8a3e]/10 flex items-center justify-center mb-4">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1b8a3e"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <p className="text-sm font-bold text-[#1b4332] mb-1">
                ফসলের ছবি আপলোড করুন
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-4 text-center">
                রোগ বা ক্ষতির ছবি তুলে AI দিয়ে বিশ্লেষণ করুন
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={analyzing}
            className="flex-1 bg-[#1b8a3e] text-white font-bold text-sm rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-[#167035] transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            ছবি নিন
          </button>
          <button
            onClick={() => galleryInputRef.current?.click()}
            disabled={analyzing}
            className="flex-1 bg-white border border-gray-300 text-gray-700 dark:text-gray-300 font-bold text-sm rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-gray-50 dark:bg-gray-800 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            গ্যালারি
          </button>

          {/* Hidden file inputs — camera vs gallery */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 animate-slide-in">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">❌</span>
              <span className="text-sm font-bold text-red-700">বিশ্লেষণ ব্যর্থ</span>
            </div>
            <p className="text-[12px] text-red-600 mb-3">{error}</p>
            <div className="flex gap-2">
              <button
                onClick={handleRetry}
                className="bg-red-500 text-white text-[11px] font-bold rounded-full px-4 py-1.5 border-none cursor-pointer hover:bg-red-600 transition-colors"
              >
                আবার চেষ্টা করুন
              </button>
              <button
                onClick={handleClear}
                className="bg-white dark:bg-gray-800 border border-red-200 text-red-600 text-[11px] font-bold rounded-full px-4 py-1.5 cursor-pointer hover:bg-red-50 transition-colors"
              >
                নতুন ছবি
              </button>
            </div>
          </div>
        )}

        {/* AI Analysis Result */}
        {result && !analyzing && !error && (
          <div className="space-y-3 mb-5 animate-slide-in">
            {/* Main diagnosis */}
            <div className={`rounded-2xl border p-4 ${sev?.bg} ${sev?.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{sev?.icon}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">বিশ্লেষণ সম্পন্ন</span>
                {urg && (
                  <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${urg.bg}`}>
                    {urg.text}
                  </span>
                )}
              </div>

              {/* Disease name */}
              <div className="mb-3">
                <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500 tracking-wider mb-0.5">
                  সম্ভাব্য রোগ
                </div>
                <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {result.disease_bn}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-0.5">
                  {result.disease_en}
                </div>
              </div>

              {/* Confidence & Severity grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white/60 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">আত্মবিশ্বাস</div>
                  <div className="text-xl font-extrabold text-[#1b4332]">{bn(result.confidence)}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-[#1b8a3e] h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(result.confidence, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="bg-white/60 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">তীব্রতা</div>
                  <div className={`text-xl font-extrabold ${sev?.text}`}>
                    {result.severity}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {result.description && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1.5">বিবরণ</div>
                <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">
                  {result.description}
                </p>
              </div>
            )}

            {/* Treatment */}
            {result.treatment && result.treatment.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <div className="text-[11px] font-bold text-green-800 mb-2">
                  চিকিৎসা পরামর্শ
                </div>
                {result.treatment.map((t, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
                    <span className="w-[20px] h-[20px] bg-green-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-[12px] text-green-800 leading-relaxed">{t}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Prevention */}
            {result.prevention && result.prevention.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="text-[11px] font-bold text-blue-800 mb-2">
                  প্রতিরোধ ব্যবস্থা
                </div>
                {result.prevention.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
                    <span className="text-blue-500 mt-0.5 flex-shrink-0">🛡️</span>
                    <span className="text-[12px] text-blue-800 leading-relaxed">{p}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Affected crops */}
            {result.affected_crops && result.affected_crops.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-2">আক্রান্ত ফসল</div>
                <div className="flex gap-2 flex-wrap">
                  {result.affected_crops.map((c, i) => (
                    <span key={i} className="text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* DAE hotline */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-[11px] text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">আরও সাহায্যের জন্য</div>
              <div className="text-sm font-bold text-[#1b4332]">DAE হটলাইন: ১৬১২৩</div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">কৃষি সম্প্রসারণ অধিদপ্তর</div>
            </div>

            {/* Clear / New analysis button */}
            <button
              onClick={handleClear}
              className="w-full bg-white border border-gray-300 text-gray-700 dark:text-gray-300 font-bold text-sm rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-gray-50 dark:bg-gray-800 transition-colors active:scale-95"
            >
              নতুন ছবি বিশ্লেষণ করুন
            </button>
          </div>
        )}

        {/* Tips */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
            ছবি তোলার টিপস
          </div>
          <div className="space-y-2">
            {[
              "আক্রান্ত পাতা বা ডাল কাছ থেকে ছবি নিন",
              "পরিষ্কার আলোতে ছবি তুলুন",
              "একাধিক কোণ থেকে ছবি নিলে ভালো ফলাফল পাবেন",
              "প্রভাবিত এলাকা ফোকাসে রাখুন",
              "ছবি স্পষ্ট ও অস্পষ্ট না হওয়া নিশ্চিত করুন",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span className="text-[12px] text-gray-600 dark:text-gray-400">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
