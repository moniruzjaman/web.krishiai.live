"use client";

/**
 * Soil Audit Tool Page
 */

import Link from "next/link";

export default function SoilPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="relative px-4 pt-5 pb-7" style={{ background: "linear-gradient(135deg,#9d174d,#831843)" }}>
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">SOIL SCIENCE</div>
        <h1 className="text-[22px] font-bold text-white mb-1">🏺 মৃত্তিকা অডিট</h1>
        <p className="text-xs text-white/70">মাটি পরীক্ষা ও সার পরামর্শ — SRDI ভিত্তিক</p>
      </div>

      <div className="px-4 pt-5 pb-24">
        <div className="bg-pink-50 border border-pink-200 rounded-2xl p-5 text-center">
          <div className="text-5xl mb-4">🏺</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">শীঘ্রই চালু হচ্ছে</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
            মাটির গুণমান পরীক্ষা, পুষ্টি বিশ্লেষণ ও সারের সুনির্দিষ্ট মাত্রা নির্ধারণ টুল শীঘ্রই যুক্ত হবে।
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 bg-[#1b8a3e] text-white font-bold text-sm rounded-full px-6 py-3 hover:bg-[#167035] transition-colors no-underline"
          >
            💬 AI থেকে জানুন
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-1">আসন্ন ফিচারসমূহ</h3>
            <div className="text-[12px] text-gray-600 space-y-1.5">
              <p>🧪 মাটির pH ও পুষ্টি বিশ্লেষণ</p>
              <p>🌾 ফসল ভিত্তিক সারের মাত্রা ক্যালকুলেটর</p>
              <p>📊 SRDI মাটি মানচিত্র ইন্টিগ্রেশন</p>
              <p>📅 সার প্রয়োগের সময়সূচি</p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-green-900 mb-1">সার সম্পর্কে জানুন</h3>
            <div className="text-[12px] text-green-800 space-y-1">
              <p>• ইউরিয়া: নাইট্রোজেন সার — পাতায় প্রয়োগ</p>
              <p>• টিএসপি: ফসফরাস সার — জমি তৈরিতে</p>
              <p>• এমওপি: পটাশিয়াম সার — ফলন বৃদ্ধিতে</p>
              <p>• জিপসাম: সালফার সার — মাটি উন্নয়নে</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
