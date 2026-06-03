"use client";

import { useState, useRef } from "react";

export default function AnalyzerPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedImage(ev.target?.result as string);
        setAnalyzing(true);
        setTimeout(() => setAnalyzing(false), 2500);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white min-h-screen">
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
          📷 ফসল এনালাইজার
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
            background: "linear-gradient(135deg,#f0fdf4,#ecfdf5)",
            border: "2px dashed #1b8a3e",
          }}
        >
          {selectedImage ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage}
                alt="Selected crop"
                className="w-full h-64 object-cover"
              />
              {analyzing && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin-slow mb-3" />
                  <span className="text-white font-bold text-sm">
                    বিশ্লেষণ চলছে...
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
              <p className="text-[11px] text-gray-500 mb-4 text-center">
                রোগ বা ক্ষতির ছবি তুলে AI দিয়ে বিশ্লেষণ করুন
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-[#1b8a3e] text-white font-bold text-sm rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-[#167035] transition-colors active:scale-95"
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
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold text-sm rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors active:scale-95"
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Sample result (shown after analysis) */}
        {!analyzing && selectedImage && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 card-shadow mb-5 animate-slide-in">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
              <span className="text-sm font-bold text-gray-900">
                বিশ্লেষণ সম্পন্ন
              </span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3">
              <div className="text-[10px] font-bold text-amber-700 tracking-wider mb-1">
                সম্ভাব্য রোগ
              </div>
              <div className="text-sm font-bold text-gray-900">
                ধানের ব্লাস্ট রোগ
              </div>
              <div className="text-[11px] text-gray-600 mt-1">
                Rice Blast (Magnaporthe oryzae)
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="text-[10px] font-bold text-green-700 mb-1">
                  আত্মবিশ্বাস
                </div>
                <div className="text-lg font-extrabold text-green-700">৮৭%</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="text-[10px] font-bold text-blue-700 mb-1">
                  তীব্রতা
                </div>
                <div className="text-lg font-extrabold text-blue-700">
                  মাঝারি
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="text-sm font-bold text-gray-900 mb-3">
            📋 ছবি তোলার টিপস
          </div>
          <div className="space-y-2">
            {[
              "আক্রান্ত পাতা বা ডাল কাছ থেকে ছবি নিন",
              "পরিষ্কার আলোতে ছবি তুলুন",
              "একাধিক কোণ থেকে ছবি নিলে ভালো ফলাফল পাবেন",
              "প্রভাবিত এলাকা ফোকাসে রাখুন",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span className="text-[12px] text-gray-600">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
