"use client";

/**
 * Pesticide Expert Tool Page
 */

import Link from "next/link";

export default function PesticidePage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="relative px-4 pt-5 pb-7" style={{ background: "linear-gradient(135deg,#b91c1c,#991b1b)" }}>
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">PESTICIDE EXPERT</div>
        <h1 className="text-[22px] font-bold text-white mb-1">🧪 বালাইনাশক বিশেষজ্ঞ</h1>
        <p className="text-xs text-white/70">নিরাপদ কীটনাশক নির্বাচন, মিক্সিং চেক ও রোটেশন</p>
      </div>

      <div className="px-4 pt-5 pb-24">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
          <div className="text-5xl mb-4">🧪</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">শীঘ্রই চালু হচ্ছে</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
            বালাইনাশক মিক্সিং চেকার, IRAC রোটেশন গাইড ও নিরাপদ প্রয়োগ মাত্রা ক্যালকুলেটর শীঘ্রই যুক্ত হবে।
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
              <p>🔬 কীটনাশক মিক্সিং সামঞ্জস্য চেকার</p>
              <p>🔄 IRAC গ্রুপ ভিত্তিক রোটেশন পরামর্শ</p>
              <p>📏 ফসল ও জমি অনুযায়ী প্রয়োগ মাত্রা</p>
              <p>⚠️ সতর্কতা ও নিরাপত্তা নির্দেশিকা</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
