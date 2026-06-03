"use client";

import Link from "next/link";

export default function SatellitePage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="relative px-4 pt-5 pb-7" style={{ background: "linear-gradient(135deg,#1d4ed8,#1e40af)" }}>
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">SATELLITE</div>
        <h1 className="text-[22px] font-bold text-white mb-1">🛰️ স্যাটেলাইট মনিটরিং</h1>
        <p className="text-xs text-white/70">জমির স্বাস্থ্য পর্যবেক্ষণ — NDVI ম্যাপিং</p>
      </div>

      <div className="px-4 pt-5 pb-24">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
          <div className="text-5xl mb-4">🛰️</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">শীঘ্রই চালু হচ্ছে</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
            স্যাটেলাইট ইমেজ ভিত্তিক ফসলের স্বাস্থ্য পর্যবেক্ষণ, NDVI ম্যাপিং ও বৃদ্ধি ট্র্যাকিং শীঘ্রই চালু হবে।
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 bg-[#1b8a3e] text-white font-bold text-sm rounded-full px-6 py-3 hover:bg-[#167035] transition-colors no-underline"
          >
            💬 AI থেকে জানুন
          </Link>
        </div>
      </div>
    </div>
  );
}
